#!/usr/bin/env node
module.exports = function(context) {
  var fs = require('fs'),
  del = require('del');
  path = require('path'),
  Q = require('q'),
  deferral = Q.defer(),
  xml2js = require('xml2js'),
  parser = new xml2js.Parser(),
  glob = require("glob");

  function delFiles(ignoreFiles, config) {
      var deferral = Q.defer(),
          fileDeferrals = [];

      glob(ignoreFiles, {}, function (er, files) {
          for (var i = 0, l = files.length; i < l; ++i) {
              fileDeferrals.push(del(files[i]));
              console.log('ignore-files.js: File `' + files[i] + '` ignored.');
          }

          deferral.resolve();
      })

      return deferral.promise.then(function() {
          return Q.all(fileDeferrals);
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
          delFiles(ignoreFiles[i].$.ignore, {})
        );
      }
      Q.all(globDeferrals).done(function() {
          deferral.resolve();
      });
    });
  });

  return deferral.promise;
};