'use strict';

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
var coin = 'btc'
const passphrase = randomString.generate(11)

var addressResult = {
  addr: String,
  balance: Float64Array,
  unconfirmed_balance: Float64Array,
  confirmed_balance: Float64Array,
  final_balance: Float64Array,
  coin_type: String,
  confirmed_transaction: Number,
  unconfirmed_transaction: Number,
  final_transaction: Number,
  user_id: Number,
  ctime: String,
  mtime: String,
}

// get all api
exports.list_all_addresses = async(req, res) => {
    await Addr.find({}, function(err, address) {
      if (err)
        res.send(err);
      res.json(address);
  });
};

// generate address api
exports.create_a_address = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const userId = q.user_id

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

  var new_address = new Addr();
  var new_wallet = new Wallet();

  // Create the bitgo wallet
  const walletOptions = {
    label : randomString.generate(4),
    passphrase: passphrase,
  };

  await bitgo.coin(coin).wallets().generateWallet(walletOptions)
  .then(async(wallet) => {
    console.log(wallet.wallet._wallet)
    let wa = wallet.wallet._wallet
    new_wallet._id = uuidv1()
    new_wallet.id = wa.id
    new_wallet.name = wa.label
    new_wallet.pass_pharse = passphrase
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

    let walletInstance = wallet.wallet
    await walletInstance.createAddress().then(function(address){
      console.log(address)
      new_address._id = uuidv1()
      new_address.id = address.id
      new_address.addr = address.address
      new_address.wallet_id = new_wallet._id
      new_address.coin_type = coin
      new_address.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
      new_address.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
    })
    .catch(function(err){
      return
    })
  })
  .catch(function(err){
    return
  });

  console.log(new_address)   
  console.log(new_wallet)

  await new_wallet.save(function(err){
    if(err) {
      res.status(500).send(err);
    }
  })

  await new_address.save(function(err, addr) {
    if(err) {
      res.status(500).send(err);
    } else {
      addressResult.addr = addr.addr
      addressResult.balance = convert.convertToCoin(new_wallet.balance) || 0
      addressResult.unconfirmed_balance = convert.convertToCoin(new_wallet.unconfirmed_balance) || 0
      addressResult.confirmed_balance = convert.convertToCoin(new_wallet.confirmed_balance) || 0
      addressResult.final_balance = 0
      addressResult.coin_type = coin
      addressResult.confirmed_transaction = 0
      addressResult.unconfirmed_transaction = 0
      addressResult.final_transaction = 0
      addressResult.user_id = new_wallet.user_id || 0
      addressResult.ctime = new_address.ctime
      addressResult.mtime = new_address.mtime

      res.status(201).json(addressResult);
    }
  });
};

exports.get_a_address = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const addr = q.addr
  var new_wallet = new Wallet()

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
    res.status(500).send(err);
    return
  });

  await Wallet.findOneAndUpdate({ id: new_wallet.id }, new_wallet, function(err, wa) {
    if (err) {
      res.status(500).send(err);
    } else {
      addressResult.addr = addr
      addressResult.balance = convert.convertToCoin(new_wallet.balance) || 0
      addressResult.unconfirmed_balance = convert.convertToCoin(new_wallet.unconfirmed_balance) || 0
      addressResult.confirmed_balance = convert.convertToCoin(new_wallet.confirmed_balance) || 0
      addressResult.final_balance = 0
      addressResult.coin_type = coin
      addressResult.confirmed_transaction = 0
      addressResult.unconfirmed_transaction = 0
      addressResult.final_transaction = 0
      addressResult.user_id = wa.user_id || 0
      addressResult.ctime = new_wallet.ctime
      addressResult.mtime = new_wallet.mtime

      res.json(addressResult);
    }
  });
};