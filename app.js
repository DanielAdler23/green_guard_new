var express = require('express')
var app = express()
var expressValidator = require('express-validator')
var session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var path = require('path')
var db = require('./serverUtils/database')
// var mongoUrl = 'mongodb://green_guard:green@ds153730.mlab.com:53730/green_guard'
var mongoUrl = 'mongodb://greenguard:greenDBguard@ds137801.mlab.com:37801/green-guard'
var port = process.env.PORT || 3000


app.use('/api/cameras', require('./routes/cameras'))
app.use('/api/users', require('./routes/users'))
app.use(expressValidator())
// app.use(expressSession({secret: 'greenguard', resave: false, saveUninitialized: true}))
app.use(session({secret: 'greenguard', resave: false, saveUninitialized: true, store: new MongoStore({url: mongoUrl})}))
app.use(express.static(path.join(__dirname, 'public')))


db.connect(mongoUrl, function(err) {
    if (err) {
        console.log(`Unable to connect to mlab, ${err.message} code: ${err.code}`)
        process.exit(1)
    } else {
        app.listen(port, function() {
            console.log(`** Green Guard Server ** \nListening on port ${port}...`)
        })
    }
})


/* USER */
//post - create new user
//get - get user details
//post - edit user details
//post - attach camera to user
//post - return camera view/pic to front
//post - edit camera rule
//get - returns all users notifications

/* CAMERA */
//post - new camera(receives camera details... saves them to the database and return ok)
//post - connect camera to user
//post - save camera picture


//get picture from camera
//send rule to camera

