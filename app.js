var express = require('express')
var app = express()
var db = require('./database')
var mongoUrl = 'mongodb://green_guard:green@ds153730.mlab.com:53730/green_guard'
var listeningPort = 3000


app.use('/api/cameras', require('./routes/cameras'))
app.use('/api/users', require('./routes/users'))

db.connect(mongoUrl, function(err) {
    if (err) {
        console.log(`Unable to connect to mlab, ${err.message} code: ${err.code}`)
        process.exit(1)
    } else {
        app.listen(listeningPort, function() {
            console.log(`** Green Guard Server ** \nListening on port ${listeningPort}...`)
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

