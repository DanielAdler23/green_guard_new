const nodemailer = require('nodemailer')
var imgur = require('imgur')
var Nexmo = require('nexmo')
var axios = require('axios')
var clientId = imgur.getClientId()
var logger = require('./logger')
imgur.setCredentials('greenguardpro@gmail.com', 'nodGreen1', clientId)


var data = JSON.stringify({
    api_key: '***',
    api_secret: '***',
    to: '***',
    from: 'Green Guard',
    text: 'You have a new notification. Please check your email for further information'
});


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'greenguardpro@gmail.com',
        pass: 'nodGreen1'
    }
})


// send mail with defined transport object
function sendMail(recipient, photoUrl) {

    let mailOptions = {
        from: '"Green Guard" <greenguardpro@gmail.com>',
        to: recipient,
        subject: 'Green Guard ALERT',
        text: 'ALERT ALERT ALERT',
        html: `<img src=${photoUrl}> </img>`
    }

    axios.post('https://rest.nexmo.com:443/sms/json', data, {headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }})
        .then(function (response) {
            console.log(response)
        })
        .catch(function (error) {
            console.log(error)
        });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else if(info)
            logger.info('Message %s sent: %s', info.messageId, info.response);
        else
            logger.error('Message could not be sent to client')
    })
}

function savePhoto(photoPath) {
    imgur.uploadFile(photoPath)
        .then(function (json) {
            logger.info(json.data.link)
        })
        .catch(function (err) {
            logger.error(err.message)
        })
}


function savePhotoBase64(photo, callback) {
    imgur.uploadBase64(photo)
        .then(function (json) {
            callback(null, json.data.link)
            // console.log(json.data.link)
        })
        .catch(function (err) {
            callback(err.message, null)
            // console.error(err.message)
        })
}


module.exports = {
    sendMail,
    savePhoto,
    savePhotoBase64
}