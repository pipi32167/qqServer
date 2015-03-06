'use strict';
var assert = require('assert');
var utils = module.exports;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if (!!cb) {
    if (typeof cb !== 'function') {
      assert.ok(false, 'param cb expect function: ' + cb);
    };

    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};
