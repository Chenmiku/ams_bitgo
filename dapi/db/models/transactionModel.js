'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var transactionSchema = new schema({
    _id: {
        type: String
    },
    id: {
        type: String
    },
    wallet_id: {
        type: String
    },
    tran_id: {
        type: String
    },
    hash: {
        type: String
    },
    total_exchanged: {
        type: Number
    },
    total_exchanged_string: {
        type: String
    },
    fees: {
        type: Number
    },
    fees_string: {
        type: String
    },
    size: {
        type: Number
    },
    state: {
        type: String
    },
    double_spend: {
        type: Boolean
    },
    block_height: {
        type: Number
    },
    confirmed_time: {
        type: String
    },
    signed_time: {
        type: String
    },
    inputs_transaction: {
        type: Number
    },
    outputs_transaction: {
        type: Number
    },
    gas_used: {
        type: Number
    },
    gas_price: {
        type: Number
    },
    gas_limit: {
        type: Number
    },
    ctime: {
        type: String
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

module.exports = mongoose.model('transactions', transactionSchema)