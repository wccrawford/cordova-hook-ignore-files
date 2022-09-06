#!/usr/bin/env node
var q = require('q');
var fs = require('fs');
var glob = require('glob');
var xml2js = require('xml2js');
var del = require('del');
// import {deleteAsync} from 'del';

module.exports = function(context) {
  var deferral = q.defer();
  var parser = new xml2js.Parser();

  function delFiles(ignoreFiles, config) {
      var deferral = q.defer(),
          fileDeferrals = [];

      glob(ignoreFiles.$.ignore, {}, function (er, files) {
          if (!files.length) {
              console.log('ignore-files.js: Nothing to ignore with pattern `' + ignoreFiles.$.ignore + '`.');

              return;
          }
          console.log('ignore-files.js: Ignoring with pattern `' + ignoreFiles.$.ignore + '`.');

          for (var i = 0, l = files.length; i < l; ++i) {
              fileDeferrals.push(del(files[i]));
              console.log('ignore-files.js: File `' + files[i] + '` ignored.');
          }

          deferral.resolve();
      })

      return deferral.promise.then(function() {
          return q.all(fileDeferrals);
      });
  }

  fs.readFile('config.xml', 'utf8', function (err, xml) {
    if (err) {
      deferral.reject('Unable to load config.xml');

      return;
    }
    parser.parseString(xml, function (err, config) {
      if (err) {
        deferral.reject('Unable to parse config.xml');

        return;
      }
      if (config.widget === undefined || config.widget['ignore-files'] === undefined) {
        return;
      }
      var ignoreFiles = config.widget['ignore-files'];

      var globDeferrals = [];
      for (var i = 0, l = ignoreFiles.length; i < l; ++i) {
        if (ignoreFiles[i].$ === undefined || ignoreFiles[i].$.ignore === undefined) {
          continue;
        }

        globDeferrals.push(
          delFiles(ignoreFiles[i], {})
        );
      }
      q.all(globDeferrals).done(function() {
          deferral.resolve();
      });
    });
  });

  return deferral.promise;
};
