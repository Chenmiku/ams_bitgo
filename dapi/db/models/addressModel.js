'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var addressSchema = new schema({
    _id: {
        type: String
    },
    id: {
        type: String
    },
    wallet_id: {
        type: String
    },
    addr: {
        type: String
    },
    coin_type: {
        type: String
    },
    ctime: {
        type: String,
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

module.exports = mongoose.model('addresses', addressSchema)