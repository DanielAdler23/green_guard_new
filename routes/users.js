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

    logger.info(`login - ${email}`)

    var users = db.get().collection('users')
    users.findOne({'email': email}, (err, user) => {
        // err ? res.status(404).send({error: err}) : res.status(200).send(doc)
        if(err)
            return res.status(404).send({error: err})
        if(!user)
            return res.status(404).send({error: 'There is no user with entered email'})
        if(!user.password == password)
            return res.status(404).send({error: "The password entered does not match user's password"})
        else {
            res.cookie('userId','asdasda', { maxAge: 900000, httpOnly: true });
            return res.status(200).send('dfghjkl;')
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
        joined: date.getTime()
    }

    db.get().collection('users').insertOne(newUser)
    return res.status(200).send({message: "User Added"})
})


router.post('/attachCameraToUser/:userId', (req,res) => {
    var userId = req.params.userId
    var cameraId = req.body.cameraId

    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'userId': userId}}, (err, doc) => {
        if(err)
            return res.status(404).send({error: err})
        else
            return res.status(200).send({message: `Camera attached to user - ${userId}`})
    })
})


module.exports = router