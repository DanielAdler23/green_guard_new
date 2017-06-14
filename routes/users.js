const config = require('../configuration')
var express = require('express')
var logger = require('./../serverUtils/logger')
var router = express.Router()
const bodyParser = require('body-parser')
var session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var db = require('./../serverUtils/database')
var ObjectID = require('mongodb').ObjectID
const utils = require('../serverUtils/serverUtils')
var mongoUrl = 'mongodb://greenguard:greenDBguard@ds137801.mlab.com:37801/green-guard'
var date = new Date()

router.use(bodyParser.json({limit: '5mb'}))
router.use(bodyParser.urlencoded({limit: '5mb', extended: true }))
router.use(session({secret: 'greenguard', resave: false, saveUninitialized: true, store: new MongoStore({url: mongoUrl})}))
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'application/json')
    next()
})


router.get('/', (req, res) => {
    res.header('Content-Type', 'text/plain')
    return res.status(200).send('Welcome To The Green Guard System')
})


router.post('/login', (req, res) => {
    var email = req.body.email
    var password = req.body.password

    logger.info(`Login - ${email}`)

    var users = db.get().collection('users')
    users.findOne({'email': email}, (err, user) => {
        if(err)
            return res.status(404).send({error: err})
        else if(!user)
            return res.status(405).send('There is no user with entered email')
        else if(user.password != password)
            return res.status(406).send("The password entered does not match user's password")
        else {
            var objectId = new ObjectID(user._id)
            // res.cookie('userId', objectId.toString(), { maxAge: 900000, encode: String })
            var data = {'redirect': 'home.html', 'userId': objectId.toString()}
            res.header('Content-Length', data.length)
            res.send(JSON.stringify(data))
            return res.end()
        }
    })
})


router.get('/dashboard', (req, res) => {
    if(!req.session.user)
        return res.status(401).send()
})


router.get('/getAll', (req, res) => {
    logger.info('All Users')
    var users = db.get().collection('users')
    users.find({}).toArray((err, docs) => {
        err ? res.status(404).send({error: err}) : res.status(200).send(docs)
    })
})

// router.get('/:userId', (req, res) => {
//     logger.info(`Getting User - ${req.params.userId}`)
//     var userId = req.params.userId
//     var objectId = new ObjectID(userId)
//
//     var users = db.get().collection('users')
//     users.findOne({'_id': objectId}, (err, doc) => {
//         err ? res.status(404).send({error: err}) : res.status(200).send(doc)
//     })
// })

router.post('/addNewUser', (req, res) => {
    logger.info('Inserting New User To Database')

    var newUser = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        admin: 0,
        joined: date.getTime(),
        cameras: []
    }

    db.get().collection('users').findOne({'email': newUser.email}, (err, doc) => {
        if(err)
            return res.status(404).send({error: err})
        else if(doc)
            return res.status(405).send({error: 'The email you entered is already registered'})
        else {
            db.get().collection('users').insertOne(newUser, (err, doc) => {
                if(err)
                    return res.status(404).send({error: err})
                else if(doc.insertedCount == 1)
                    return res.status(200).send({message: "User Added"})
            })
        }
    })
})


router.post('/attachCameraToUser/:userId', (req,res) => {
    var userId = req.params.userId
    var cameraId = req.body.cameraId
    var objectId = new ObjectID(userId)

    db.get().collection('users').findOneAndUpdate({'_id': objectId}, {$push: { cameras: cameraId }}, (err, user) => {
        if(err)
            return res.status(404).send({error: err})
        else
            db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'userId': userId}}, (err, doc) => {
                if(err)
                    return res.status(404).send({error: err})
                else
                    return res.status(200).send({message: `Camera attached to user - ${userId}`})
            })
    })
})


router.get('/getUsersCameras/:userId', (req, res) => {
    logger.info('Getting user cameras')

    if(req.params.userId != "undefined")
        var userId = req.params.userId
    else
        return res.status(400).send({message: 'No user id'})
    var objectId = new ObjectID(userId)

    db.get().collection('users').findOne({'_id': objectId}, (err, user) => {
        if(err)
            return res.status(404).send({error: err})
        else {
            var requests = user.cameras.map(cameraId => getUserCamera(cameraId))

            Promise.all(requests)
                .then(cameras => res.status(200).send(cameras))
                .catch(err => res.status(404).send({error: err}))
        }
    })
})


router.get('/getUsersAlerts/:userId', (req, res) => {
    logger.info("Getting user's alerts")

    var userId = req.params.userId
    var objectId = new ObjectID(userId)

    db.get().collection('users').findOne({'_id': objectId}, (err, user) => {
        if(err)
            return res.status(404).send({error: err})
        else if(user) {
            var requests = user.cameras.map(cameraId => getCameraAlerts(cameraId))

            Promise.all(requests)
                .then(cameras => res.status(200).send(cameras[0]))
                .catch(err => res.status(404).send({error: err}))
        } else
            return res.status(400).send({message: `There is no user with id - ${userId}`})
    })
})


const getUserCamera = (cameraId) =>  new Promise((resolve, reject) => {
    db.get().collection('cameras').findOne({'id': cameraId}, (err, doc) => {
        if (err)
            reject(err)
        else
            resolve(doc)
    })
})

const getCameraAlerts = (cameraId) => new Promise((resolve, reject) => {
    db.get().collection('alerts').find({'cameraId': cameraId}).toArray((err, docs) => {
        if (err)
            reject(err)
        else {
            console.log(docs)
            resolve(docs)
        }
    })
})


module.exports = router