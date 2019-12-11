'use strict';

const express = require('express');
const router = express.Router();
const addrController = require('../api/public/addressController');

router.get('/getall', addrController.list_all_addresses)
router.post('/generate', addrController.create_a_address)
router.get('/get_by_address', addrController.get_a_address)

module.exports = router