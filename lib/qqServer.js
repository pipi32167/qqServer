/**
 * QQ server singleton, use test2/sig-test.js to test
 */

'use strict';
var assert = require('assert');
var md5 = require('MD5');
var qs = require('querystring')
var crypto = require('crypto');
var request = require('request');
var _ = require('underscore');
var logger = require('./logger'); //use your logger
var httpUtil = require('./httpUtil');
var utils = require('./utils');
var consts = require('./consts');

var QQServer = function(config) {

  this.config = config;

  logger.debug(this.config);

  this.baseUrl = this.config.sns.baseUrl;
  logger.debug('QQ url:', this.baseUrl);
};

QQServer.prototype.createPaySig = function(method, uri, params) {
  var encodeUri = encodeURIComponent(uri);

  if (this.config.pay.debug) {
    logger.debug('step 1.1:\n', encodeUri);
  }
  params =
    _(params)
    .chain()
    .pairs()
    .sortBy(function(elem) {
      return elem[0];
    })
    .object()
    .value();

  if (this.config.pay.debug) {
    logger.debug('step 1.2:\n', params);
  }

  params = qs.stringify(params);
  var encodeParams = encodeURIComponent(params);

  if (this.config.pay.debug) {
    logger.debug('step 1.3:\n', params);
  }

  var sourceStr = method + '&' + encodeUri + '&' + encodeParams;

  if (this.config.pay.debug) {
    logger.debug('step 1.4:\n', sourceStr);
  }

  var sourceKey = this.config.pay.paykey + '&';

  if (this.config.pay.debug) {
    logger.debug('step 2:\n', sourceKey);
  }

  var hmac = crypto.createHmac('sha1', sourceKey);
  hmac.update(sourceStr);
  var res = hmac.digest('base64');

  if (this.config.pay.debug) {
    logger.debug('step 3:\n', res);
  }

  return res;
}

QQServer.prototype.createPayCookieJar = function(url, args, txType) {
  var j = request.jar();
  for (var key in args) {
    if (args.hasOwnProperty(key)) {
      var value = encodeURIComponent(args[key]);
      j.setCookieSync(key + '=' + value, url);
    }
  }

  var cookies;
  if (txType === consts.TXPlatformType.GUEST) {
    cookies = this.config.pay.guest_cookies;
  } else {
    cookies = this.config.pay.cookies;
  }
  cookies.forEach(function(elem) {
    j.setCookieSync(elem, url);
  });
  return j;
}

QQServer.prototype.verifyLogin = function(args, cb) {
  if (this.config.type === consts.SnsType.QQ) {
    this.qqVerifyLogin(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxVerifyLogin(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqVerifyLogin = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey &&
    typeof args.txType !== 'undefined'
  );

  if (!this.config.enable) {
    utils.invokeCallback(cb);
    return;
  }

  var timestamp = Math.floor(Date.now() / 1000);
  var appkey = this.config.appkey;
  var sig = md5(appkey + timestamp);
  var appid, url, body;
  if (args.txType === consts.TXPlatformType.GUEST) {
    appid = this.config.guestappid;
    url = this.baseUrl + '/auth/guest_check_token';
    body = {
      guestid: args.openid,
      accessToken: args.openkey,
    };
  } else {
    appid = this.config.appid;
    url = this.baseUrl + '/auth/verify_login';
    body = {
      openkey: args.openkey,
      openid: args.openid,
      appid: appid,
    };
  }

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: url,
  }, cb);
}

QQServer.prototype.wxVerifyLogin = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey &&
    typeof args.txType !== 'undefined'
  );

  if (!this.config.enable) {
    utils.invokeCallback(cb);
    return;
  }

  var timestamp = Math.floor(Date.now() / 1000);
  var appkey = this.config.appkey;
  var sig = md5(appkey + timestamp);
  var appid, url, body;
  if (args.txType === consts.TXPlatformType.GUEST) {
    appid = this.config.guestappid;
    url = this.baseUrl + '/auth/guest_check_token';
    body = {
      guestid: args.openid,
      accessToken: args.openkey,
    };
  } else {
    appid = this.config.appid;
    url = this.baseUrl + '/auth/check_token';
    body = {
      accessToken: args.openkey,
      openid: args.openid,
      appid: appid,
    };
  }

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: url,
  }, cb);
}

QQServer.prototype.profile = function(args, cb) {
  if (this.config.type === consts.SnsType.QQ) {
    this.qqProfile(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxProfile(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqProfile = function(args, cb) {
  assert.ok(!!args.openid, args.openid);
  assert.ok(!!args.openkey, args.openkey);

  if (!this.config.enable) {
    utils.invokeCallback(cb, null, {
      nickName: 'test',
    });
    return;
  }

  var timestamp = Date.now();
  var appkey = this.config.appkey;
  var appid = this.config.appid;
  var sig = md5(appkey + timestamp);

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  var body = {
    accessToken: args.openkey,
    openid: args.openid,
    appid: appid,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: this.baseUrl + '/relation/qqprofile',
  }, cb);
}

QQServer.prototype.wxProfile = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey);

  if (!this.config.enable) {
    utils.invokeCallback(cb, null, {
      nickName: 'test',
    });
    return;
  }

  var timestamp = Date.now();
  var appkey = this.config.appkey;
  var appid = this.config.appid;
  var sig = md5(appkey + timestamp);

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  var body = {
    accessToken: args.openkey,
    openid: args.openid,
    appid: appid,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: this.baseUrl + '/relation/wxuserinfo',
  }, function(err, res) {
    if (!err) {
      res.nickName = res.nickname; // compatible with qq version
    }
    utils.invokeCallback(cb, err, res);
  });
}

QQServer.prototype.friends = function(args, cb) {

  if (this.config.type === consts.SnsType.QQ) {
    this.qqFriends(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxFriends(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqFriends = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey);

  if (!this.config.enable) {
    utils.invokeCallback(cb, null, {
      lists: []
    });
    return;
  }

  var timestamp = Date.now();
  var appkey = this.config.appkey;
  var appid = this.config.appid;
  var sig = md5(appkey + timestamp);

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  var body = {
    accessToken: args.openkey,
    openid: args.openid,
    appid: appid,
    flag: 2,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: this.baseUrl + '/relation/qqfriends_detail',
  }, cb);
}

QQServer.prototype.wxFriends = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey);

  if (!this.config.relation.enable) {
    utils.invokeCallback(cb, null, {
      lists: []
    });
    return;
  }

  var timestamp = Date.now();
  var appkey = this.config.appkey;
  var appid = this.config.appid;
  var sig = md5(appkey + timestamp);

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  var body = {
    accessToken: args.openkey,
    openid: args.openid,
    appid: appid,
    flag: 2,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: this.baseUrl + '/relation/wxfriends',
  }, cb);
}

QQServer.prototype.getBalance = function(args, cb) {

  if (this.config.type === consts.SnsType.QQ) {
    this.qqGetBalance(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxGetBalance(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqGetBalance = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
      save_amt: 0,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/get_balance_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: args.pay_token,
    appid: this.config.pay.payid,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

QQServer.prototype.wxGetBalance = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 10000,
      gen_balance: 100000,
      save_amt: 0,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/get_balance_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: '',
    appid: this.config.pay.payid,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

/**
 * [pay description]
 * @param  {Object}   args args
 * @param  {Object}   args   {
 *                             amt: Number, cost coin
 *                           }
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
QQServer.prototype.pay = function(args, cb) {

  if (this.config.type === consts.SnsType.QQ) {
    this.qqPay(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxPay(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqPay = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
      billno: 'xx',
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/pay_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: args.pay_token,
    appid: this.config.pay.payid,
    amt: args.amt,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

QQServer.prototype.wxPay = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
      billno: 'xx',
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/pay_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: '',
    appid: this.config.pay.payid,
    amt: args.amt,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

/**
 * [cancelPay description]
 * @param  {Object}   args args
 * @param  {Object}   args   {
 *                             amt: Number, cost coin
 *                             billno: String, return by '/mpay/pay_m' before
 *                           }
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
QQServer.prototype.cancelPay = function(args, cb) {

  if (this.config.type === consts.SnsType.QQ) {
    this.qqCancelPay(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxCancelPay(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqCancelPay = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId &&
    typeof args.amt !== 'undefined' &&
    !!args.billno);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/cancel_pay_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: args.pay_token,
    appid: this.config.pay.payid,
    amt: args.amt,
    billno: args.billno,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

QQServer.prototype.wxCancelPay = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId &&
    typeof args.amt !== 'undefined' &&
    !!args.billno);
  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/cancel_pay_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: '',
    appid: this.config.pay.payid,
    amt: args.amt,
    billno: args.billno,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}


/**
 * [cancelPay description]
 * @param  {Object}   args args
 * @param  {Object}   args   {
 *                             presenttimes: Number, add coin
 *                           }
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
QQServer.prototype.present = function(args, cb) {

  if (this.config.type === consts.SnsType.QQ) {
    this.qqPresent(args, cb);
  } else if (this.config.type === consts.SnsType.WX) {
    this.wxPresent(args, cb);
  } else {
    assert.ok(false, 'invalid sns type:' + this.config.type);
  }
}

QQServer.prototype.qqPresent = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId &&
    typeof args.presenttimes !== 'undefined');

  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/present_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: args.pay_token,
    appid: this.config.pay.payid,
    discountid: this.config.pay.discountid,
    giftid: this.config.pay.giftid,
    presenttimes: args.presenttimes,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

QQServer.prototype.wxPresent = function(args, cb) {

  assert.ok(!!args.openid &&
    !!args.openkey &&
    !!args.pf &&
    !!args.pfkey &&
    !!args.pay_token &&
    typeof args.txType !== 'undefined' &&
    !!args.serverId &&
    typeof args.presenttimes !== 'undefined');

  if (!this.config.pay.enable) {
    utils.invokeCallback(cb, null, {
      balance: 100000,
      gen_balance: 100000,
    });
    return;
  }

  var method = 'GET';
  var uri = '/mpay/present_m';
  var url = this.config.pay.baseUrl + uri;
  var params = {
    openid: args.openid,
    openkey: args.openkey,
    pay_token: '',
    appid: this.config.pay.payid,
    discountid: this.config.pay.discountid,
    giftid: this.config.pay.giftid,
    presenttimes: args.presenttimes,
    ts: Math.floor(Date.now() / 1000),
    pf: args.pf,
    pfkey: args.pfkey,
    zoneid: args.serverId,
  };
  params.sig = this.createPaySig(method, uri, params);
  var j = this.createPayCookieJar(url, {
    org_loc: uri,
  }, args.txType);
  httpUtil.qqRequest({
    url: url,
    jar: j,
    method: method,
    qs: params,
  }, cb);
}

QQServer.prototype.loadVip = function(args, cb) {
  assert.ok(!!args.openid &&
    !!args.openkey);

  var vipFlag = consts.QQVipFlag.VIP_NORMAL;

  var callback = function(err, res) {
    if (!err) {
      res = _(res.lists).find(function(elem) {
        return elem.flag === vipFlag;
      });
    }
    utils.invokeCallback(cb, err, res);
  }

  if (!this.config.enable) {

    utils.invokeCallback(callback, null, {
      lists: [{
        flag: 1,
        ispay: 0,
        isvip: 0,
        level: 0,
        luxury: 0,
        qqLevel: 0,
        year: 0
      }]
    });
    return;
  }

  var timestamp = Date.now();
  var appkey = this.config.appkey;
  var appid = this.config.appid;
  var sig = md5(appkey + timestamp);

  var query = {
    timestamp: timestamp,
    appid: appid,
    sig: sig,
    openid: args.openid,
    encode: 1,
  };
  var body = {
    accessToken: args.openkey,
    openid: args.openid,
    appid: appid,
    login: 2, //default 
    uin: 0, //default
    vip: vipFlag,
  };
  httpUtil.qqRequest({
    method: 'post',
    qs: query,
    body: JSON.stringify(body),
    url: this.baseUrl + '/profile/load_vip',
  }, callback);
}

module.exports = function(config) {
  return new QQServer(config);
}