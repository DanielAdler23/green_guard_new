var winston = require('winston')
var moment = require('moment')


function consoleFormatter(args) {
    var date = moment().format("D/MM/YYYY HH:mm:ss")
    return `${date} - ${winston.config.colorize(args.level, args.level.toUpperCase())} - ${args.message}`
}

function fileFormatter(args) {
    var date = moment().format("D/MM/YYYY HH:mm:ss")
    return `${date} - ${args.level} - ${args.message}`
}
function tsFormatter() {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

module.exports = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: tsFormatter(),
            formatter: (options) => consoleFormatter(options),
            prettyPrint: true
        }),
        new (winston.transports.File)({
            filename: 'logs.log',
            timestamp: tsFormatter(),
            formatter: (options) => fileFormatter(options),
            json: false
        })
    ]
})


