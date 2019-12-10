'use strict';

const express = require('express');
const router = express.Router();
const addrController = require('../api/public/addressController');

router.get('/getall', addrController.list_all_addresses)
router.post('/generate', addrController.create_a_address)
router.get('/get/:id', addrController.read_a_address)
router.put('/update/:id', addrController.update_a_address)
router.delete('/mark_delete/:id', addrController.delete_a_address)

module.exports = router