'use strict';

var mongoose = require('mongoose'),
  Addr = mongoose.model('addresses'),
  uuidv1 = require('uuid/v1'),
  add = ''

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'test'  }) //accessToken: 'v2xe12eaaa3ddafa1866ddf034f3b53d8e5186dccf62b72d59eb99a6e60cf573399'
const Promise = require('bluebird')
const accessToken = process.env.AccessToken
const coin = 'tbtc'

bitgo.authenticateWithAccessToken({ accessToken });


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