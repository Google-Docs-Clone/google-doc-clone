const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DocumentSchema = new Schema(
    {
        name: {type: String, require: true},
        yjs: {type: Array, require: true}
    },
    { timestamps: true }
)

module.exports = mongoose.model('Document', DocumentSchema)
