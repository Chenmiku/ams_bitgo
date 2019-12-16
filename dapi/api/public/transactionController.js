'use strict';

// library and modules
const mongoose = require('mongoose'),
  Wallet = mongoose.model('wallets'),
  Trans = mongoose.model('transactions'),
  uuidv1 = require('uuid/v1'),
  url = require('url'),
  convert = require('../modules/convert_to_coin'),
  axios = require('axios'),
  qs = require('querystring'),
  re = require('../modules/response')

//bitgo
const BitGoJS = require('bitgo')
const bitgo = new BitGoJS.BitGo({ env: 'prod'  })
const accessToken = process.env.AccessToken
bitgo.authenticateWithAccessToken({ accessToken });

// variables
var coin = 'btc'

var transactionResult = {
  data: {
    confirm:         Boolean,    
    message:         String, 
    tx_hash:         String,  
    tx_type:         String,  
    tx_value:        String, 
    tx_fee:          String, 
    chk_fee_value:   Number, 
    tx_total_amount: String,     // Value + Fee
    pre_balance:     String,     // balance
    next_balance:    String,     // Current Balance in wallet - Total Transaction Amount
    tx_create_time:  String
  },
  success: Boolean,
};

var depositStateResult = {
  data: {
    coin_type:  String,  
    coin_value: String, 
    confirm:    Boolean,    
    message:    String, 
  },
  success: Boolean,
};

// api get all transaction 
exports.list_all_transaction = async(req, res) => {
    await Trans.find({}, function(err, transaction) {
      if (err)
        res.send(err);
      res.json(transaction);
  });
};

// api send coin to polebit
exports.create_a_transaction = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const sender = q.sender
  const receiver = q.receiver
  var trans = new Trans()
  var chkFeeValue = 20
  var walletPassphrase = ""

  // check params
  if (sender == "" || receiver == "") {
    errorMessage('sender_or_receiver_empty', res, 400)
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

  // get chk fee value
  const requestBody = {
    'search_type': coinType
  }
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
	await axios.post(process.env.GetFeeURL, qs.stringify(requestBody), config)
	.then(function(res){
		chkFeeValue = Number(res.data.resp[0].chk_fee_value)
	})
	.catch(function(err){
		re.errorResponse('cant_get_fee', res, 500);
    return
  });
  
  //get balance address
  await bitgo.coin(coin).wallets().getWalletByAddress({ address: sender })
  .then(async(wallet) => {
    // get wallet 
    let walletInstance = wallet._wallet
    console.log(walletInstance)
    await Wallet.findOne({ id: walletInstance.id }, function(err,wa){
      if (err) {
        re.errorResponse('address_not_found', res, 404);
        return
      }
      if (wa.balance <= 10000) {
        re.errorResponse('not_enough_fund', res, 500);
        return
      }
      walletPassphrase = wa.pass_pharse

      trans.wallet_id = wa._id

      transactionResult.data.pre_balance = String(convert.convertToCoin(coin, wa.balance))
    });

    let params = {};

    // set params for request send transaction
    switch(coin) {
      case 'btc':
        params = {
          amount: walletInstance.balance - 10000,
          address: receiver,
          walletPassphrase: walletPassphrase
        };
        break;
      case 'eth':
        params = {
          amount: walletInstance.balance - chkFeeValue * 1000000000 * 21000,
          address: receiver,
          walletPassphrase: walletPassphrase
        };
        break;
      default :
        params = {
          amount: walletInstance.balance - chkFeeValue,
          address: receiver,
          walletPassphrase: walletPassphrase
        };
        break;
    }

    // send transaction
    await wallet.send(params)
    .then(function(transaction) {
        console.log(transaction);
        trans._id = uuidv1()
        trans.id = transaction.transfer.id
        trans.tran_id = transaction.txid
        trans.hash = transaction.tx
        trans.sender = sender
        trans.receiver = receiver
        trans.coin_type = coin
        trans.total_exchanged = transaction.transfer.baseValue
        trans.total_exchanged_string = transaction.transfer.baseValueString
        trans.fees = parseInt(transaction.transfer.feeString)
        trans.fees_string = transaction.transfer.feeString
        trans.size = transaction.transfer.vSize
        trans.state = transaction.transfer.state
        trans.block_height = transaction.transfer.height
        trans.signed_time = transaction.transfer.signedTime.replace('T', ' ').replace('Z', '')
        trans.ctime = new Date().toISOString().replace('T', ' ').replace('Z', '')
        trans.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')

        transactionResult.data.tx_hash = transaction.tx
        transactionResult.data.chk_fee_value = chkFeeValue
        transactionResult.data.tx_value = String(convert.convertToCoin(coin, Math.abs(trans.total_exchanged)))
        transactionResult.data.tx_fee = String(convert.convertToCoin(coin, trans.fees))
        transactionResult.data.tx_total_amount = String(convert.convertToCoin(coin, Math.abs(transaction.transfer.value)))
        transactionResult.data.next_balance = (parseFloat(transactionResult.data.pre_balance) - parseFloat(transactionResult.data.tx_total_amount)).toFixed(8)
        transactionResult.data.tx_create_time = trans.ctime
    })
    .catch(function(err){
      re.errorResponse('not_enough_fund', res, 500);
      return
    });

  })
  .catch(function(err){
    re.errorResponse('address_not_found', res, 404);
    return
  });

  // create a new transaction
  await trans.save(function(err,tran){
    if (err) {
      re.errorResponse('error_create_transaction', res, 500)
    } else {
      transactionResult.data.confirm = false
      transactionResult.data.message = "transaction_pending"
      transactionResult.data.tx_type = coin
      transactionResult.success = true

      res.json(transactionResult);
    }
  })
};

// api check deposit state by address
exports.check_deposit_state = async(req, res) => {
  let q = url.parse(req.url, true).query;
  const coinType = q.coin_type;
  const addr = q.addr
  var wallet = new Wallet()
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
    console.log(wa)
    new_wallet.id = wa.id
    new_wallet.balance = wa.balance || 0
    new_wallet.balance_string = wa.balanceString
    new_wallet.confirmed_balance = wa.confirmedBalance || 0
    new_wallet.confirmed_balance_string = wa.confirmedBalanceString
    new_wallet.spendable_balance = wa.spendableBalance || 0
    new_wallet.spendable_balance_string = wa.spendableBalanceString
    new_wallet.mtime = new Date().toISOString().replace('T', ' ').replace('Z', '')
  })
  .catch(function(err){
    re.errorResponse('address_not_found', res, 404);
    return
  });

  // get wallet by id 
  await Wallet.findOne({ id: new_wallet.id }, function(err, wa){
    if (err) {
      re.errorResponse('address_not_found', res, 404);
      return
    }
    wallet = wa
  })

  console.log(new_wallet.balance)
  console.log(new_wallet.confirmed_balance)
  console.log(wallet.balance)
  if (wallet.balance_string != new_wallet.balance_string && new_wallet.balance_string == new_wallet.confirmed_balance_string) {
    depositStateResult.data.coin_type = coin
    depositStateResult.data.coin_value = String(convert.convertToCoin(coin, Math.abs(new_wallet.balance - wallet.balance)))
    depositStateResult.data.confirm = true
    depositStateResult.data.message = "transaction_confirmed"
    depositStateResult.success = true

    // update wallet
    await Wallet.findOneAndUpdate({ id: new_wallet.id }, new_wallet, function(err, wa) {
      if (err) {
        re.errorResponse('address_not_found', res, 404);
        return
      } else {
        res.json(depositStateResult);
        return
      }
    });
  }

  // check transaction state
  if (wallet.balance_string != new_wallet.balance_string && new_wallet.balance_string != new_wallet.confirmed_balance_string) {
    depositStateResult.data.coin_type = coin
    depositStateResult.data.coin_value = String(convert.convertToCoin(coin, Math.abs(new_wallet.balance - wallet.balance)))
    depositStateResult.data.confirm = true
    depositStateResult.data.message = "transaction_pending"
    depositStateResult.success = true

    res.json(depositStateResult);
    // update wallet
    // await Wallet.findOneAndUpdate({ id: new_wallet.id }, new_wallet, function(err, wa) {
    //   if (err) {
    //     re.errorResponse('address_not_found', res, 404);
    //     return
    //   } else {
    //     res.json(depositStateResult);
    //     return
    //   }
    // });
  } else {
    depositStateResult.data.coin_type = coin
    depositStateResult.data.coin_value = "0"
    depositStateResult.data.confirm = false
    depositStateResult.data.message = "no_transaction"
    depositStateResult.success = true

    res.json(depositStateResult);
  }
};
