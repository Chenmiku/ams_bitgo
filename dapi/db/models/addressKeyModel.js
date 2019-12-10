'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var addresskeySchema = new schema({
    _id: {
        type: String
    },
    addr: {
        type: String
    },
    public_key: {
        type: String
    },
    private_key: {
        type: String
    },
    ctime: {
        type: Date,
        default: Date.now()
    }, 
}, {
    versionKey: false // remove __v
})

// change display _id to id
addresskeySchema.method('transform', function() {
    var obj = this.toObject()
 
    //Rename fields
    obj.id = obj._id;
    delete obj._id;
 
    return obj;
})

module.exports = mongoose.model('addresskeys', addresskeySchema)