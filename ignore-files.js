#!/usr/bin/env node
var q = require('q');
var fs = require('fs');
var glob = require('glob');
var xml2js = require('xml2js');
var fsProm = require('fs/promises');

module.exports = async function(context) {
    return new q.Promise((resolve, reject) => {
        var parser = new xml2js.Parser();

        async function delFiles(ignoreFiles, config) {
            return new q.Promise((resolve, reject) => {
                var fileDeferrals = [];

                glob(ignoreFiles.$.ignore, {}, function (er, files) {
                    if (!files.length) {
                        console.log('ignore-files.js: Nothing to ignore with pattern `' + ignoreFiles.$.ignore + '`.');

                        return;
                    }
                    console.log('ignore-files.js: Ignoring with pattern `' + ignoreFiles.$.ignore + '`.');

                    for (var i = 0, l = files.length; i < l; ++i) {
                        fileDeferrals.push(
                            fsProm.rm(files[i], {force: true, recursive: true}).catch((exc) => {
                                console.log('Exception', exc)
                            })
                        );
                        // console.log('ignore-files.js: File `' + files[i] + '` ignored.');
                    }

                    q.all(fileDeferrals).done(() => {
                        // console.log('ignore-files.js: Done delFiles');
                        resolve();
                    });
                });
            });
        }

        fs.readFile('config.xml', 'utf8', function (err, xml) {
            if (err) {
                reject('Unable to load config.xml');

                return;
            }
            parser.parseString(xml, function (err, config) {
                if (err) {
                    reject('Unable to parse config.xml');

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
                q.all(globDeferrals).done(function () {
                    console.log('ignore-files.js: Done');
                    resolve();
                });
            });
        });
    });
};
