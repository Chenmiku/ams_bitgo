'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var addresskeySchema = new schema({
    _id: {
        type: String
    },
    id: {
        type: String
    },
    public_key: {
        type: String,
        required: true
    },
    private_key: {
        type: String,
        required: true
    },
    ctime: {
        type: String,
        required: true
    }, 
    mtime: {
        type: String
    },
    dtime: {
        type: String
    }
}, {
    versionKey: false // remove __v
})

module.exports = mongoose.model('addresskeys', addresskeySchema)