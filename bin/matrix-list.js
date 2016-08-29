#!/usr/bin/env node

require('./matrix-init');
var program = require('commander');
var firebase = require('matrix-firebase');
var debug = debugLog('list');

Matrix.localization.init(Matrix.localesFolder, Matrix.config.locale, function () {

  program
    .parse(process.argv);
  var pkgs = program.args;

  if (!pkgs.length || showTheHelp) {
    displayHelp();
  }

  function handleResponse(err, app) {
    if (err) return console.error(err);
    console.log(require('util').inspect(app, { depth: 3, colors: true }));
  }

  var target = pkgs[0];

  firebase.init(
    Matrix.config.user.id,
    Matrix.config.device.identifier,
    Matrix.config.user.token,
    function (err) {
      if (err) {
        console.error('Error initializing Firebase: ', err);
        process.exit();
      }


      if (target.match(/all/)) {
        Matrix.api.device.getAppList(Matrix.config.device.identifier, function (err, resp) {
          if (err) return console.error(t('matrix.list.app_list_error') + ':', err);
          if (_.isEmpty(resp)) return console.error(t('matrix.list.no_results'));
          debug('Device List>', resp);
          console.log(Matrix.helpers.displayDeviceApps(resp));
        });

      } else if (target.match(/app/)) {
        if (firebaseWorkers) {
          firebase.app.getApps(Matrix.config.device.identifier, Matrix.config.user.token, function (err, data) {
            if (err) return console.error('- ', t('matrix.list.app_list_error') + ':', err);
            if (_.isUndefined(data)) data = {};
            console.log(Matrix.helpers.displayApps(data));
            process.exit();
          });
        } else {
          firebase.app.list( function(err, apps){
            console.log(Matrix.helpers.displayApps(apps));
            process.exit();
          });
        }

      } else if (target.match(/device/)) {

        var group = pkgs[1];
        /** do nothing if not device **/
        if (group !== undefined) {
          // Matrix.api.user.setToken(Matrix.config.user.token);
          var options = {
            group: group
          };
          Matrix.api.device.list(options, function(body) {
            //print device
            console.log(Matrix.helpers.displayDevices(body));
            process.exit();
          });
        } else {
          Matrix.api.device.list({}, function(body) {
            //print device
            console.log(Matrix.helpers.displayDevices(body));
            // save device map to config
            Matrix.config.deviceMap = _.map(JSON.parse(body).results, function(d){
              return { name: d.name, id: d.deviceId }
            });
            Matrix.helpers.saveConfig(function(){
              process.exit();
            });
          });
        }

      } else if (target.match(/group/)) {

        /** do nothing if not device **/
        Matrix.api.group.list(function (body) {
          //print group
          console.log(Matrix.helpers.displayGroups(body));
          process.exit();
        });
      } else {
        displayHelp();
      }
    }
  );

  function displayHelp() {
    console.log('\n> matrix list ¬\n');
    console.log('\t    matrix list devices -', t('matrix.list.help_devices').grey)
    console.log('\t     matrix list groups -', t('matrix.list.help_groups').grey)
    console.log('\t       matrix list apps -', t('matrix.list.help_apps').grey)
    console.log('\t        matrix list all -', t('matrix.list.help_all').grey)
    console.log('\n')
    process.exit(1);
  }

 // TODO: support config <app>
});
