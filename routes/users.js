var express = require('express')
var logger = require('./../logger')
var router = express.Router()
const bodyParser = require('body-parser')
var db = require('./../database')
var ObjectID = require('mongodb').ObjectID
const utils = require('../serverUtils')
var date = new Date()

router.use(bodyParser.json({limit: '5mb'}))
router.use(bodyParser.urlencoded({limit: '5mb', extended: true }))
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'application/json')
    next()
})


router.get('/', (req, res) => {
    res.header('Content-Type', 'text/plain')
    res.status(200).send('Welcome To The Green Guard System')
})

router.get('/getAll', (req, res) => {
    logger.info('All Users')
    var users = db.get().collection('users')
    users.find({}).toArray((err, docs) => {
        err ? res.status(404).send({error: err}) : res.status(200).send(docs)
    })
})

router.get('/:userId', (req, res) => {
    logger.info(`Getting User - ${req.params.userId}`)
    var userId = req.params.userId
    var objectId = new ObjectID(userId)

    var users = db.get().collection('users')
    users.findOne({'_id': objectId}, (err, doc) => {
        err ? res.status(404).send({error: err}) : res.status(200).send(doc)
    })
})

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
    res.status(200).send({message: "User Added"})
})


router.post('/attachCameraToUser/:userId', (req,res) => {
    var userId = req.params.userId
    var cameraId = req.body.cameraId

    db.get().collection('cameras').findOneAndUpdate({'id': cameraId}, {$set: {'userId': userId}}, (err, doc) => {
        if(err)
            res.status(404).send({error: err})
        else
            res.status(200).send({message: `Camera attached to user - ${userId}`})
    })
})


module.exports = router