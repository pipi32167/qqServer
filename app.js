'use strict';
var _ = require('underscore');
var async = require('async');
var config = require('./config/QQ.json');
// var config = require('./config/WX.json');
var consts = require('./lib/consts');
var QQServer = require('./lib/qqServer')(config);

var qqArgs = {
	serverId: 3001,
	openid: 'your_qq_openid',
	openkey: 'your_qq_openkey',
	pf: 'your_qq_pf',
	pfkey: 'your_qq_pfkey',
	pay_token: 'your_qq_pay_token',
	txType: consts.TXPlatformType.QQ
};

var wxArgs = {
	serverId: 4001,
	openid: 'your_qq_openid',
	openkey: 'your_qq_openkey',
	pf: 'your_qq_pf',
	pfkey: 'your_qq_pfkey',
	pay_token: 'your_qq_pay_token',
	txType: consts.TXPlatformType.WX
};

/**
 * verifyLogin example
 */

var verifyLogin_qq = function() {

	QQServer.verifyLogin(qqArgs, function(err, res) {
		console.log(err, res);
	})
}


var verifyLogin_wx = function() {
	QQServer.verifyLogin(wxArgs, function(err, res) {
		console.log(err, res);
	})
}

/**
 * profile example
 */

var profile_qq = function() {

	QQServer.profile(qqArgs, function(err, res) {
		console.log(err, res);
	});
}

var profile_wx = function() {

	QQServer.profile(wxArgs, function(err, res) {
		console.log(err, res);
	});
}

/**
 * friends example
 */
var friends_qq = function() {

	QQServer.friends(qqArgs, function(err, res) {
		console.log(err, res);
	});
}

var friends_wx = function() {

	QQServer.friends(wxArgs, function(err, res) {
		console.log(err, res);
	});
}

/**
 * getBalance example
 */
var getBalance_qq = function() {

	QQServer.getBalance(qqArgs, function(err, res) {
		console.log(err, res);
	})
}

var getBalance_wx = function() {

	QQServer.getBalance(wxArgs, function(err, res) {
		console.log(err, res);
	})
}

/**
 * pay example
 */
var pay_qq = function() {

	var billno, amt = 1;

	async.series({
		pay: function(cb) {
			var args = _(qqArgs).chain().clone().extend({
				amt: amt
			}).value();
			QQServer.pay(args, function(err, res) {
				console.log(err, res);
				if (!err) {
					billno = res.billno;
				}
				cb(err);
			})
		},

		cancelPay: function(cb) {
			var args = _(qqArgs).chain().clone().extend({
				billno: billno,
				amt: amt,
			}).value();
			QQServer.cancelPay(args, function(err, res) {
				console.log(err, res);
				cb(err);
			})

		}
	}, function(err) {

	})
};

var pay_wx = function() {

	var billno, amt = 1;

	async.series({
		pay: function(cb) {
			var args = _(wxArgs).chain().clone().extend({
				amt: amt
			}).value();
			QQServer.pay(args, function(err, res) {
				console.log(err, res);
				if (!err) {
					billno = res.billno;
				}
				cb(err);
			})
		},

		cancelPay: function(cb) {
			var args = _(wxArgs).chain().clone().extend({
				billno: billno,
				amt: amt,
			}).value();
			QQServer.cancelPay(args, function(err, res) {
				console.log(err, res);
				cb(err);
			})

		}
	}, function(err) {

	})
};

/**
 * present example
 */
var present_qq = function() {

	var args = _(qqArgs).chain().clone().extend({
		presenttimes: 1,
	}).value();
	QQServer.present(args, function(err, res) {
		console.log(err, res);
	})
}

var present_wx = function() {

	var args = _(wxArgs).chain().clone().extend({
		presenttimes: 1,
	}).value();
	QQServer.present(args, function(err, res) {
		console.log(err, res);
	})
}


/**
 * loadVip example, no wx vip
 */
var loadVip_qq = function() {

	QQServer.loadVip(qqArgs, function(err, res) {
		console.log(err, res);
	});
}

// verifyLogin_qq();
// profile_qq();
// friends_qq();
// getBalance_qq();
// pay_qq();
// present_qq();
loadVip_qq();