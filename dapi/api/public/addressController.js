'use strict';

const mongoose = require('mongoose'),
  Addr = mongoose.model('addresses'),
  uuidv1 = require('uuid/v1'),
  Wallet = mongoose.model('wallets'),
  randomString = require('randomstring'),
  url = require('url')

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'test'  }) //accessToken: 'v2xe12eaaa3ddafa1866ddf034f3b53d8e5186dccf62b72d59eb99a6e60cf573399'
const Promise = require('bluebird')
const accessToken = process.env.AccessToken
var coin = 'tbtc'
var add = ''

// var result = {
//   addr: String,
//   name: String,
//   ctime: String
// }

exports.list_all_addresses = async(req, res) => {
    await Addr.find({}, function(err, address) {
      if (err)
        res.send(err);
      res.json(address);
  });
};

exports.create_a_address = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const userId = q.user_id

  switch(coinType) {
    case 'tbtc':
      coin = 'tbtc';
      break;
    case 'btc':
      coin = 'btc';
      break;
    case 'eth':
      coin = 'eth';
      break;
    default :
      coin = 'tbtc';
      break;
  }

  let new_address = new Addr(req.body);
  let new_wallet = new Wallet();

  // Create the bitgo wallet
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions = {
    label : randomString.generate(4),
    passphrase: randomString.generate(11),
  };

  bitgo.coin(coin).wallets()
  .generateWallet(walletOptions)
  .then(function(wallet){
    console.log(wallet)
    // const walletInstance = wallet.wallet;
  
    // walletInstance.createAddress().then(function(address){
    //   console.log(address)
    // })
  });

  return

  new_address._id = uuidv1()
  new_address.addr = add
  new_address.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  new_address.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  console.log(new_address)   
  await new_address.save(function(err, addr) {
    if (err) {
      res.status(500).send(err);
    }
    res.status(201).json(addr);
  });
};

exports.get_a_address = function(req, res) {
  Addr.findById(req.params.id, function(err, address) {
    if (err)
      res.send(err);
    res.json(address);
  });
};