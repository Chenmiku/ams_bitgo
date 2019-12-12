'use strict';

const mongoose = require('mongoose'),
  Wa = mongoose.model('wallets')

exports.list_all_wallet = async(req, res) => {
    await Wa.find({}, function(err, wallet) {
      if (err)
        res.send(err);
      res.json(wallet);
  });
};