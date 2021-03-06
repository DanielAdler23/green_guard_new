const config = require('../configuration')
var express = require('express')
var axios = require('axios')
var logger = require('./../serverUtils/logger')
var router = express.Router()
const bodyParser = require('body-parser')
var session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var multer  = require('multer')
var upload = multer({ storage: multer.memoryStorage(), dest: 'uploads/' })
var db = require('./../serverUtils/database')
var ObjectID = require('mongodb').ObjectID
const utils = require('../serverUtils/serverUtils')
var mongoUrl = 'mongodb://greenguard:greenDBguard@ds137801.mlab.com:37801/green-guard'

var axiosConfig = {
    headers: {'Content-Type': 'application/json'},
    timeout: 4000
}


router.use(bodyParser.json({limit: '5mb'}))
router.use(bodyParser.urlencoded({limit: '5mb', extended: true }))
router.use(session({secret: 'greenguard', resave: false, saveUninitialized: true, store: new MongoStore({url: mongoUrl})}))
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'application/json')
    next()
})

function updateCamerasPhoto(cameraId, img) {
    utils.savePhotoBase64(img, (err, url) => {
        if(err) {
            logger.error(err)
            return res.status(404).send({message: `Failed to save camera's photo to image database`, error: err})
        } else {
            db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'picture': url}}, (err, doc) => {
                if(err) logger.error('Failed to save camera photo')
                return null
            })
        }
    })
}

router.get('/', (req, res) => {
    res.header('Content-Type', 'text/plain')
    res.status(200).send('Welcome To The Green Guard System')
})


router.get('/getAll', (req, res) => {
    logger.info('All Cameras')
    db.get().collection('cameras').find({}, {_id: 0}).toArray((err, docs) => {
        err ? res.status(404).send({error: err}) : res.status(200).send(docs)
    })
})


router.get('/getFreeCameras', (req, res) => {
    logger.info('All Free Cameras')
    db.get().collection('cameras').find({userId: {$exists: false}}).toArray((err, docs) => {
        err ? res.status(404).send({error: err}) : res.status(200).send(docs)
    })
})


router.post('/newCamera', upload.array('file', 12), (req, res) => {
    logger.info('Adding new camera to camera pool')

    db.get().collection('cameras').findOne({'id': req.body.cameraId}, (err, doc) => {
        if(err) {
            logger.error(err)
            return res.status(404).send({error: err})
        } else if(doc) {
            logger.info(`Camera ${req.body.cameraId} already exists in database`)
            var photoBase64 = req.files[0].buffer.toString('base64')
            updateCamerasPhoto(req.body.cameraId, photoBase64)
            return res.status(605).send({message: 'Camera already exists in database'})
        } else {
            var photoBase64 = req.files[0].buffer.toString('base64')

            utils.savePhotoBase64(photoBase64, (err, url) => {
                if(err) {
                    logger.error(err)
                    return res.status(404).send({message: `Failed to save camera's photo to image database`, error: err})
                } else {
                    var newCamera = {
                        'id': req.body.cameraId,
                        'ip': req.body.ip,
                        'port': req.body.port,
                        'added': Date.now(),
                        'picture': url,
                        'status': 0
                    }

                    db.get().collection('cameras').insertOne(newCamera, (err, result) => {
                        if(err) {
                            logger.error(`Could not insert new camera to database -${err}`)
                            return res.status(404).send({
                                message: `Failed to save camera's photo to image database`,
                                error: err
                            })
                        } else {
                            logger.info(`New camera added to pool ID - ${req.body.cameraId}`)
                            return res.status(200).send({message: `New camera added to pool ID - ${req.body.cameraId}`})
                        }
                    })
                }
            })
        }
    })
})


router.get('/deleteCamera/:userId/:cameraId', (req, res) => {
    var userId = req.params.userId
    var cameraId = req.params.cameraId
    var objectId = new ObjectID(userId)

    db.get().collection('cameras').remove({'id': cameraId}, (err, doc) => {
        if(err) {
            logger.error({error: err})
            return res.status(404).send({error: err})
        } else

        db.get().collection('users').findOneAndUpdate({'_id': objectId}, {$pop: { cameras: cameraId }}, (err, user) => {
            if(err) {
                logger.error({error: err})
                return res.status(404).send({error: err})
            } else {
                logger.info(`deleted camera - ${cameraId} from user - ${userId}`)
                return res.status(200).send(user)
            }
        })
    })
})


router.get('/getCamera/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    logger.info(`Getting camera - ${cameraId}`)
    // var objectId = new ObjectID(cameraId)
    var cameras = db.get().collection('cameras')

    cameras.findOne({'id': cameraId},{_id: 0},  (err, doc) => {
        err ? res.status(400).send({error: err})
            : doc ? res.status(200).send(doc)
            : res.status(404).send({message: `There is no camera with id - ${cameraId}`})
    })
})


router.get('/getImage/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    logger.info(`Getting picture of camera - ${cameraId}`)
    // var objectId = new ObjectID(cameraId)
    var cameras = db.get().collection('cameras')

    cameras.findOne({'id': cameraId}, (err, doc) => {
        err ? res.status(400).send({error: err})
            : doc ? (doc.picture ? res.status(200).send(doc.picture) : res.status(200).send({message: "Camera doesn't have a picture"}))
            : res.status(200).send({message: `There is no camera with id - ${cameraId}`})
    })
})

router.get('/getLiveImage/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    var cameras = db.get().collection('cameras')
    cameras.findOne({'id': cameraId}, (err, doc) => {
        if (err)
            res.status(400).send({error: err})
        else if (doc.status == 0 ){
                res.status(503).send({message:'camera not no online'})
        }
        else if (doc.status == 1) {
            var cameraUrl = `http://${doc.ip}:${doc.port}/getLivePicture`
            axios.get(cameraUrl, axiosConfig)
                .then(response => res.status(200).send({'message': response.data.pic}))
                .catch(err => {
                    logger.error(err)
                    return res.status(404).send({message: 'camera not online', err: err.message})
                })
        } else
            res.status(404).send({message: `No camera with id - ${cameraId}`})
    })
})


router.post('/setRule/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    logger.info(`Setting camera's rule for camera ${cameraId}`)
    // var objectId = new ObjectID(cameraId)

    var newRule = {
        'inOut': req.body.inOut == 0 ? 0 : req.body.inOut == 1 ? 1 : null,
        'polygon': req.body.polygon ? req.body.polygon : []
    }

    var cameras = db.get().collection('cameras')
    cameras.findOneAndUpdate({'id': cameraId}, {$set: {'rule': newRule}}, (err, doc) => {
        if (err)
            res.status(400).send({error: err})
        else if (doc.value) {
            var cameraUrl = `http://${doc.value.ip}:${doc.value.port}/setRule`
            logger.info(cameraUrl)
            axios.post(cameraUrl, newRule, axiosConfig)
                .then(response => res.status(200).send({message: `Rule set for camera - ${cameraId}`}))
                .catch(err => {
                    logger.error(`camera not online - ${cameraId}`)
                    return res.status(404).send({message: 'camera not online', err: err.message})
                })
        } else
            res.status(404).send({message: `No camera with id - ${cameraId}`})
    })
})

router.get('/startCamera/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    var cameras = db.get().collection('cameras')

    logger.info(`Starting camera - ${cameraId}`)

    cameras.findOne({'id': cameraId}, (err, doc) => {
        if(err)
            res.status(400). send({error: err})
        else if(doc) {
            var cameraUrl = `http://${doc.ip}:${doc.port}/startCamera`
            logger.info(cameraUrl)
            axios.get(cameraUrl)
                .then(response => {
                    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'status': 1}}, (err, doc) => {
                        if(err)
                            return res.status(404).send({error: err})
                        else if(doc.value)
                            return res.status(200).send({message: `Camera started - ${cameraId}`})
                        else
                            return res.status(302).send({'message': `There is no camera with id - ${cameraId}`})
                    })
                })
                .catch(err => res.status(404).send({message: 'camera not online', err: err.message}))
        } else
            res.status(404).send({message: `No camera with id - ${cameraId}`})
    })
})


router.get('/stopCamera/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    var cameras = db.get().collection('cameras')

    logger.info(`Stop camera - ${cameraId}`)

    cameras.findOne({'id': cameraId}, (err, doc) => {
        if(err)
            res.status(400). send({error: err})
        else if(doc) {
            var cameraUrl = `http://${doc.ip}:${doc.port}/stopCamera`
            logger.info(cameraUrl)
            axios.get(cameraUrl)
                .then(response => {
                    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'status': 0}}, (err, doc) => {
                        if(err)
                            return res.status(404).send({error: err})
                        else if(doc.value)
                            return res.status(200).send({message: `Camera stopped - ${cameraId}`})
                        else
                            return res.status(302).send({'message': `There is no camera with id - ${cameraId}`})
                    })
                })
                .catch(err => res.status(404).send({message: 'camera not online', err: err.message}))
        } else
            res.status(404).send({message: `No camera with id - ${cameraId}`})
    })
})


router.post('/setName/:cameraId', (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    var cameraName = req.body.cameraName
    // var cameras = db.get().collection('cameras')

    logger.info(`Setting name for camera - ${cameraId}`)

    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'name': cameraName}}, (err, doc) => {
        if(err) {
            logger.error(err)
            res.status(400).send({error: err})
        } else if(doc)
            res.status(200).send({message: `Camera name set - ${cameraId} -> ${cameraName}`})
        else
            res.status(404).send({message: `No camera with id - ${cameraId}`})
    })
})

router.post('/editRule/:cameraId', (req, res) => {
    // console.log("Editing camera's rule")
    // var cameras = db.get().collection('cameras')
    // cameras.find({}).toArray((err, docs) => {
    //     err ? res.status(404).send({error: err}) : res.status(200).send(docs)
    // })
})


router.get('/cameraStatus/:cameraId/:status', (req, res) => {
    var cameraId = req.params.cameraId
    var status = req.params.status

    logger.info(`Changing camera ${cameraId} status to - ${status}`)

    var cameras = db.get().collection('cameras')

    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'status': parseInt(status)}}, (err, doc) => {
        if(err)
            return res.status(404).send({error: err})
        else if(doc.value)
            return res.status(200).send(doc.value)
        else
            return res.status(302).send({'message': `There is no camera with id - ${cameraId}`})
    })
})


router.post('/cameraAlert/:cameraId', upload.array('file', 12), (req, res) => {
    var cameraId = req.params.cameraId
    if(!cameraId) return res.status(502).send({message: 'Login required'})
    logger.warn(`## Got alert from camera - ${cameraId} ##`)

    // if(!req.files[0].buffer)
    //     return res.status(400).send({error: 'Alert has no photo'})

    var photoBase64 = req.files[0].buffer.toString('base64')

    utils.savePhotoBase64(photoBase64, (err, url) => {
        if(err)
            return res.status(404).send({error: `Failed to save camera's photo to image database`, error: err})
        else {
            var newAlert = {
                'alertId': req.body.alertId,
                'cameraId': req.body.cameraId,
                'timestamp': req.body.time,
                'pictures': [
                    {
                        'photo': url,
                        'timestamp': req.body.time
                    }
                ]
            }
            db.get().collection('alerts').insertOne(newAlert)
            db.get().collection('cameras').findOne({'id': cameraId}, (err, doc) => {
                if(err)
                    return res.status(404).send({error: err})
                else if(doc) {
                    var objectId = new ObjectID(doc.userId)
                    db.get().collection('users').findOne({'_id': objectId}, (err, doc) => {
                        if(err)
                            return res.status(404).send({error: err})
                        else if(doc) {
                            utils.sendMail(doc.email, url)
                            return res.status(200).send({message: `New alert from camera - ${req.body.cameraId}`})
                        } else
                            return res.status(200).send({message: `No user with id - ${doc.userId}`})
                    })
                }
            })
        }
    })
})


router.post('/cameraAlertPhoto/:alertId', upload.array('file', 12), (req, res) => {
    var alertId = req.params.alertId
    if(!alertId) return res.status(502).send({message: 'Login required'})
    logger.info(`Got new photo from alert - ${alertId}`)

    // var photoUrl = utils.savePhoto(req.files[0].buffer)

    var photoBase64 = req.files[0].buffer.toString('base64')

    utils.savePhotoBase64(photoBase64, (err, url) => {
        if(err)
            return res.status(404).send({error: `Failed to save camera's photo to image database`, error: err})
        else {
            var newPhoto = {
                'photo': url,
                'timestamp': req.body.time
            }

            var alerts = db.get().collection('alerts')
            alerts.findOneAndUpdate({'alertId': alertId}, {$push: {'pictures': newPhoto}}, (err, doc) => {
                err ? res.status(400).send({error: err}) : res.status(200).send({message: 'Added alert image'})
            })
        }
    })
})


router.get('/getAlert/:alertId', (req, res) => {
    var alertId = req.params.alertId
    if(!alertId) return res.status(502).send({message: 'Login required'})
    var alerts = db.get().collection('alerts')
    alerts.findOne({'alertId': alertId}, (err, doc) => {
        err ? res.status(400).send({error: err}) : res.status(200).send({doc})
    })
})




//
// router.get('/word/:word', (req, res) => {
//     var word = req.params.word
//     console.log(`Get Tweets With Specific Word - ${word}`)
//     var tweets = db.get().collection(collection)
//     tweets.find({text: {$regex: `.*${word}.*`}}).toArray((err, docs) => {
//         err ? res.status(404).send({error:err}) : res.status(200).send(docs)
//     })
// })
//
// router.get('/time/:from/:to', (req, res) => {
//     var from = parseInt(req.params.from)
//     var to = parseInt(req.params.to)
//     console.log(`Get All Tweets Betweeen ${from} - ${to}`)
//     var tweets = db.get().collection(collection)
//     tweets.find({time: {$gt: from - 1, $lt: to + 1}}, { user: 0, picture: 0, text: 0, timestamp: 0, location: 0, time: 0 }).limit(15000).toArray((err, docs) => {
//         err ? res.status(404).send({error:err}) : res.status(200).send(docs)
//     })
// })
//
// router.get('/:id/content', (req, res) => {
//     var id = req.params.id
//     var objectId = new ObjectID(id);
//     console.log(`Get Tweet - ${id}`)
//     var tweets = db.get().collection(collection)
//     tweets.find({ "_id": objectId }).toArray((err, docs) => {
//         err ? res.status(404).send({error:err}) : res.status(200).send(docs)
//     })
// })

module.exports = router