"use strict";
var config = require('./config');

var Utils = {};

Utils.encryptPassword = function(password) {
	return require('crypto').createHmac('sha512', config.cryptoKey).update(password).digest('hex');
}

exports = module.exports = Utils;