'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var addressSchema = new schema({
    _id: {
        type: String
    },
    addr: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    ctime: {
        type: String
    }, 
    mtime: {
        type: String
    }
}, {
    versionKey: false // remove __v
})

// change display _id to id
addressSchema.method('transform', function() {
    var obj = this.toObject()
 
    //Rename fields
    obj.id = obj._id;
    delete obj._id;
 
    return obj;
})

module.exports = mongoose.model('addresses', addressSchema)