'use strict';

// library and modules
const mongoose = require('mongoose'),
  Addr = mongoose.model('addresses'),
  uuidv1 = require('uuid/v1'),
  Wallet = mongoose.model('wallets'),
  randomString = require('randomstring'),
  url = require('url'),
  convert = require('../modules/convert_to_coin')

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'prod'  })
const accessToken = process.env.AccessToken
bitgo.authenticateWithAccessToken({ accessToken }); 

// variables
var coin = 'btc'
const passphrase = randomString.generate(11)

var addressResult = {
  data: {
    addr: String,
    balance: String,
    unconfirmed_balance: String,
    confirmed_balance: String,
    final_balance: String,
    coin_type: String,
    confirmed_transaction: Number,
    unconfirmed_transaction: Number,
    final_transaction: Number,
    user_id: Number,
    ctime: String,
    mtime: String,
  },
  success: Boolean,
}

var errorMessage = {
  message: String,
  success: Boolean,
}

// api get all
exports.list_all_addresses = async(req, res) => {
    await Addr.find({}, function(err, address) {
      if (err)
        res.send(err);
      res.json(address);
  });
};

// api generate address
exports.create_a_address = async(req, res) => {
  const q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const userId = q.user_id;
  var new_address = new Addr();
  var new_wallet = new Wallet();

  let walletOptions = {};

  // check coin type
  switch(coinType) {
    case 'btc':
      coin = 'btc';
      walletOptions = {
        label : randomString.generate(4),
        passphrase: passphrase,
      };
      break;
    case 'eth':
      coin = 'eth';
      walletOptions = {
        label : randomString.generate(4),
        passphrase: passphrase,
        enterprise: process.env.EnterpriseID
      };
      break;
    default :
      coin = 'btc';
      walletOptions = {
        label : randomString.generate(4),
        passphrase: passphrase,
      };
      break;
  }

  // Create the bitgo wallet
  await bitgo.coin(coin).wallets().generateWallet(walletOptions)
  .then(async(wallet) => {
    console.log(wallet.wallet._wallet)
    let wa = wallet.wallet._wallet
    new_wallet._id = uuidv1()
    new_wallet.id = wa.id
    new_wallet.name = wa.label
    new_wallet.pass_pharse = passphrase
    new_wallet.enterprise_id = process.env.EnterpriseID
    new_wallet.balance = wa.balance || 0
    new_wallet.balance_string = wa.balanceString
    new_wallet.confirmed_balance = wa.confirmedBalance || 0
    new_wallet.confirmed_balance_string = wa.confirmedBalanceString
    new_wallet.unconfirmed_balance = wa.spendableBalance || 0
    new_wallet.unconfirmed_balance_string = wa.spendableBalanceString
    new_wallet.user_id = userId || 0
    new_wallet.coin_type = coin
    new_wallet.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
    new_wallet.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')

    // create a new address in bitgo
    let walletInstance = wallet.wallet
    await walletInstance.createAddress().then(function(address){
      new_address._id = uuidv1()
      new_address.id = address.id
      new_address.addr = address.address
      new_address.wallet_id = new_wallet._id
      new_address.coin_type = coin
      new_address.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
      new_address.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
    })
    .catch(function(err){
      errorResponse(err, res, 500);
      return
    })
  })
  .catch(function(err){
      errorResponse(err, res, 500);
      return
  });

  // create a new wallet
  await new_wallet.save(function(err){
    if(err) {
      errorResponse(err, res, 500);
      return
    }
  })

  // create a new address
  await new_address.save(function(err, addr) {
    if(err) {
      errorResponse('error_create_address', res, 500);
    } else {
      addressResult.data.addr = addr.addr
      addressResult.data.balance = String(convert.convertToCoin(coin, new_wallet.balance))
      addressResult.data.unconfirmed_balance = String(convert.convertToCoin(coin, new_wallet.unconfirmed_balance))
      addressResult.data.confirmed_balance = String(convert.convertToCoin(coin, new_wallet.confirmed_balance))
      addressResult.data.final_balance = ""
      addressResult.data.coin_type = coin
      addressResult.data.confirmed_transaction = 0
      addressResult.data.unconfirmed_transaction = 0
      addressResult.data.final_transaction = 0
      addressResult.data.user_id = new_wallet.user_id || 0
      addressResult.data.ctime = new_address.ctime
      addressResult.data.mtime = new_address.mtime
      addressResult.success = true

      res.status(201).json(addressResult);
    }
  });
};

// Api get By address
exports.get_a_address = async(req, res) => {
  const q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const addr = q.addr
  var new_wallet = new Wallet()

  // check params
  if (addr == "") {
    errorMessage('address_empty', res, 400)
    return
  }

  // check coin type
  switch(coinType) {
    case 'btc':
      coin = 'btc';
      break;
    case 'eth':
      coin = 'eth';
      break;
    default :
      coin = 'btc';
      break;
  }

  //get balance address
  await bitgo.coin(coin).wallets().getWalletByAddress({ address: addr })
  .then(function(wallet) {
    let wa = wallet._wallet
    console.log(wallet._wallet)
    new_wallet.id = wa.id
    new_wallet.balance = wa.balance || 0
    new_wallet.balance_string = wa.balanceString
    new_wallet.confirmed_balance = wa.confirmedBalance || 0
    new_wallet.confirmed_balance_string = wa.confirmedBalanceString
    new_wallet.unconfirmed_balance = wa.spendableBalance || 0
    new_wallet.unconfirmed_balance_string = wa.spendableBalanceString
    new_wallet.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  })
  .catch(function(err){
    errorResponse('address_not_found', res, 404);
    return
  });

  // update wallet 
  await Wallet.findOneAndUpdate({ id: new_wallet.id }, new_wallet, function(err, wa) {
    if (err) {
      errorResponse('address_not_found', res, 404);
    } else {
      addressResult.data.addr = addr
      addressResult.data.balance = String(convert.convertToCoin(coin, new_wallet.balance))
      addressResult.data.unconfirmed_balance = String(convert.convertToCoin(coin, new_wallet.unconfirmed_balance))
      addressResult.data.confirmed_balance = String(convert.convertToCoin(coin, new_wallet.confirmed_balance))
      addressResult.data.final_balance = ""
      addressResult.data.coin_type = coin
      addressResult.data.confirmed_transaction = 0
      addressResult.data.unconfirmed_transaction = 0
      addressResult.data.final_transaction = 0
      addressResult.data.user_id = wa.user_id || 0
      addressResult.data.ctime = new_wallet.ctime
      addressResult.data.mtime = new_wallet.mtime
      addressResult.success = true

      res.json(addressResult);
    }
  });
};

// error message response
function errorResponse(err, res, statusCode) {
  errorMessage.message = err
  errorMessage.success = false
  res.status(statusCode).json(errorMessage);
}