const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        email: {type: String, require: true},
        name: {type: String, require: true},
        password: {type: String, require: true},
        verified: {type: Boolean, require: true}
    }
)

module.exports = mongoose.model('User', UserSchema)
