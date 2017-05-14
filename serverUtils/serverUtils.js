const nodemailer = require('nodemailer')
var imgur = require('imgur')
var clientId = imgur.getClientId()
var logger = require('./logger')
imgur.setCredentials('greenguardpro@gmail.com', 'nodGreen1', clientId)

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

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        }
        logger.info('Message %s sent: %s', info.messageId, info.response);
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