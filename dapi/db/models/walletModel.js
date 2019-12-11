'use strict'

var mongoose = require('mongoose')
var schema = mongoose.Schema

var walletSchema = new schema({
    _id: {
        type: String
    },
    id: {
        type: String
    },
    name: {
        type: String
    },
    pass_pharse: {
        type: String
    },
    balance: {
        type: Number
    },
    balance_string: {
        type: String
    },
    unconfirmed_balance: {
        type: Number
    },
    unconfirmed_balance_string: {
        type: String
    },
    final_balance: {
        type: Number
    },
    final_balance_string: {
        type: String
    },
    confirmed_transaction: {
        type: Number
    },
    unconfirmed_transaction: {
        type: Number
    },
    final_transaction: {
        type: Number
    },
    user_id: {
        type: Number
    },
    coin_type: {
        type: String
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

module.exports = mongoose.model('wallets', walletSchema)