var mongoose = require('mongoose')
var Schema = mongoose.Schema


var userSchema = new Schema({
    name: String,
    email: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: Boolean,
    joined: Date
})


var User = mongoose.model('User', userSchema)

module.exports = User