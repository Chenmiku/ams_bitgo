'use strict';

var mongoose = require('mongoose'),
  Addr = mongoose.model('addresses'),
  uuidv1 = require('uuid/v1')

var add = ''

//coinbase
// var Client = require('coinbase').Client
// var client = new Client({'apiKey': 'y2B5Cz5x1gVb9vDv', 'apiSecret': '8ItCbdIt3KWzmkgIgdiveQZcV1VyJZZk'})
// client.getAccount('c60bc2c4-9d8d-5400-989b-07116f81079f', function(err, account){
//   account.createAddress(null, function(err, address){
//     //console.log(address)
//     add = address.address
//   })
// })

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'test'  }) //accessToken: 'v2xe12eaaa3ddafa1866ddf034f3b53d8e5186dccf62b72d59eb99a6e60cf573399'
const Promise = require('bluebird')
const accessToken = process.env.AccessToken
const coin = 'tbtc'

bitgo.authenticateWithAccessToken({ accessToken });
let key = bitgo.coin(coin).keychains().create();
add = key.pub
console.dir(key)

//web3
// const Web3 = require('web3')
// const INFURA_ACCESS_TOKEN = process.env.AccessToken //'9dbfe23237eb4aaba35ddf287bc7c9da' //'sr0bmrEU4BjPyWgUpMZZ'
// const mainnet = process.env.Provider + INFURA_ACCESS_TOKEN //'https://mainnet.infura.io/v3/'+INFURA_ACCESS_TOKEN
// const w3 = new Web3(new Web3.providers.HttpProvider(mainnet))
// var res = w3.eth.accounts.create()
// add = res.address

// w3.eth.getGasPrice().then(console.log)

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

exports.create_a_address = function(req, res) {
  var new_address = new Addr(req.body);
  new_address._id = uuidv1()
  new_address.addr = add
  new_address.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  new_address.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  console.log(new_address)   
  // result.addr = add
  // result.name = new_address.name
  // result.ctime = new_address.ctime
  new_address.save(function(err, addr) {
    if (err) {
      res.status(500).send(err);
    }
    res.status(201).json(addr);
  });
};

exports.read_a_address = function(req, res) {
  Addr.findById(req.params.id, function(err, address) {
    if (err)
      res.send(err);
    res.json(address);
  });
};

exports.update_a_address = function(req, res) {
  var new_address = new Addr(req.body);
  new_address.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  Addr.findOneAndUpdate({_id:req.params.id}, new_address, {new: true}, function(err, address) {
    if (err)
      res.send(err);
    res.json(address);
  });
};

exports.delete_a_address = function(req, res) {
  Addr.deleteOne({
    _id: req.params.id
  }, function(err, address) {
    if (err)
      res.send(err);
    res.json({ message: 'Address successfully deleted' });
  });
};