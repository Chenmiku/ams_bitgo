'use strict';

const mongoose = require('mongoose'),
  Addr = mongoose.model('addresses'),
  Wallet = mongoose.model('wallets'),
  Trans = mongoose.model('transactions'),
  uuidv1 = require('uuid/v1'),
  url = require('url'),
  convert = require('../modules/convert_to_coin')

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'prod'  })
const accessToken = process.env.AccessToken
bitgo.authenticateWithAccessToken({ accessToken });
var coin = 'btc'

var transactionResult = {
  confirm:         Boolean,    
	message:         String, 
	tx_hash:         String,  
	tx_type:         String,  
	tx_value:        Float64Array, 
	tx_fee:          Float64Array, 
	chk_fee_value:   Number, 
	tx_total_amount: Float64Array,     // Value + Fee
	pre_balance:     Float64Array,     // balance
	next_balance:    Float64Array,     // Current Balance in wallet - Total Transaction Amount
	tx_create_time:  String
}

var depositStateResult = {
  coin_type:  String,  
	coin_value: Float64Array, 
	confirm:    Boolean,    
	message:    String, 
}

exports.list_all_transaction = async(req, res) => {
    await Trans.find({}, function(err, transaction) {
      if (err)
        res.send(err);
      res.json(transaction);
  });
};

exports.create_a_transaction = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const receiver = q.receiver
  const value = q.value

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

  var new_address = new Addr(req.body);   
  new_address.save(function(err, addr) {
    if (err) {
      res.status(500).send(err);
    }
    res.status(201).json(addr);
  });
};

exports.check_deposit_state = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const addr = q.addr
  var wallet = new Wallet()
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
  });

  await Wallet.findOne({ id: new_wallet.id }, function(err, wa){
    if (err) {
      return
    }
    wallet = wa
  })

  if (wallet.balance != new_wallet.balance) {
    depositStateResult.coin_type = coin
    depositStateResult.coin_value = convert.convertToCoin(new_wallet.balance - wallet.balance)
    depositStateResult.confirm = true
    depositStateResult.message = "transaction_confirmed"
  }

  if (new_wallet.unconfirmed_balance > 0) {
    depositStateResult.coin_type = coin
    depositStateResult.coin_value = convert.convertToCoin(new_wallet.unconfirmed_balance)
    depositStateResult.confirm = false
    depositStateResult.message = "transaction_pending"
  } else {
    depositStateResult.coin_type = coin
    depositStateResult.coin_value = 0
    depositStateResult.confirm = false
    depositStateResult.message = "no_transaction"
  }

  await Wallet.findOneAndUpdate({ id: new_wallet.id }, new_wallet, function(err, wa) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(depositStateResult);
    }
  });
};