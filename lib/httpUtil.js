'use strict';
var request = require('request');
var logger = require('./logger');
var utils = require('./utils');
var Code = require('./code');

var exp = module.exports;

exp.qqRequest = function(opts, cb) {
  logger.debug('qqRequest:', opts);
  var res = request(opts, function(err, resp, body) {
    if (!!err) {
      logger.warn('httpUtil.qqReuqest error:', opts.url, err);
      utils.invokeCallback(cb, Code.MSG_RESULT_WEB_UNKNOWN_ERROR);
      return;
    };

    if (!!err || resp.statusCode !== 200) {

      var statusCode = !!resp ? resp.statusCode : null;
      logger.warn('httpUtil.qqReuqest failed:', opts.url, err, statusCode, body);
      utils.invokeCallback(cb, body.ret);
      return;
    };

    try {
      body = JSON.parse(body);
    } catch (e) {
      logger.warn('httpUtil.qqReuqest failed:', opts.url, e, body);
      utils.invokeCallback(cb, Code.MSG_RESULT_QQ_UNKNOWNN_ERROR);
      return;
    }

    if (body.ret !== 0) {
      logger.warn('httpUtil.qqReuqest failed:', opts.url, body);
      utils.invokeCallback(cb, body.ret);
    } else {
      logger.debug('qqResponse:', body);
      utils.invokeCallback(cb, null, body);
    }
  })
  logger.debug('url: ', res.uri.href);
  logger.debug('cookie: ', res.headers.cookie);
}