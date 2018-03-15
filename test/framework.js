#!/usr/bin/env node
// -*- coding: utf-8 -*-
"use strict"

/**
 *  Test framework for the girocppjs simulator.
 *
 */

var exec = require('child_process').exec;

var Test = {

  centralSystem:  null,
  chargePoint:    null,

  cp:     'gir-ocppjs.js start_cp',
  cs:     'gir-ocppjs.js start_cs',

  options:  null,
  args:     null,

  currentCommandIndex: 0,
  testStarted: false,

  /**
   *
   */
  init: function(opt) {
    if(process.argv.length < 3) {
      console.log('Usage: node <file> <soap|websocket> [url] [id] [from]');
      console.log('  .ex: node test-cp-1.2.js websocket');
      console.log('  .ex: node test-cp-1.2.js soap http://192.168.1.12:9000/ '+
        'boxid http://192.168.1.25:9001');
      process.exit(1);
    }

    var args = process.argv.slice(2),
        options = {
          system: opt.system || 'cp',
          version: opt.version || '1.6',
          transport: opt.transport || args[0] || 'websocket'
        },
        args = args.slice(1);

    Test.options = options;
    Test.args = args;

    Test.startCentralSystem();
    // delayed started
    setTimeout(function() {
      Test.startChargePoint();

      if(options.system == 'cs') {
        setTimeout(function() {
          Test.chargePoint.stdin.write('bootnotification\n');
        }, 1000);
      }
    }, 500);
  },

  /**
   *
   */
  startCentralSystem: function() {
    // only start a cs if no url specified
    if(Test.args.length != 0)
      return;

    var tp = '-t '+ Test.options.transport,
        prot = '-p ocpp'+ Test.options.version,
        cmd = 'node ../'+ Test.cs +' 9000 '+ prot +' '+ tp;

    Test.centralSystem = exec(cmd);
    Test.centralSystem.stdout.on('data', Test.stdOutHandler);
  },

  /**
   *
   */
  startChargePoint: function() {
    var tp = '-t '+ Test.options.transport,
      prot = '-p ocpp'+ Test.options.version,
      uriProt = Test.options.transport == 'websocket' ? 'ws' : 'http',
      uri = Test.args[0] || uriProt +'://localhost:9000',
      cpId = Test.args[1] || 'boxid',
      from = Test.args[2] || uriProt +'://localhost:9001',
      cmd = 'node ../'+ Test.cp +' '+ uri +' '+ cpId +' '+ prot +' '+ tp;

    Test.chargePoint = exec(cmd);
    Test.chargePoint.stdout.on('data', Test.stdOutHandler);
  },

  /**
   *
   */
  retrieveError: function(data) {
    if(data.toLowerCase().indexOf('error:') > -1)
      return true;

    var errors = ['NotImplemented', 'NotSupported', 'InternalError',
      'ProtocolError', 'SecurityError', 'PropertyConstraintViolation',
      'OccurenceConstraintViolation', 'TypeConstraintViolation',
      'GenericError'];

    for(var e in errors) {
      if(data.indexOf(errors[e]) > -1)
        return true;
    }

    return false;
  },

  /**
   *
   */
  stdOutHandler: function(data) {
    if(Test.retrieveError(data)) {
      console.log('[ERROR] Test failed for `'+
        Test.commands[Test.currentCommandIndex] +'\'.');
      console.log('Output: '+ data);
      process.exit(1);
    }
    else {
      // TODO: find better way
      // only trigger the next action when the response of the current is
      // received
      if(Test.testStarted) {
        var next = false;

        if(Test.options.transport == 'websocket') {
          if(data.indexOf('<<') > 0 && data.indexOf('[3,') > 0)
            next = true;
        }
        else if(Test.options.transport == 'soap') {
          if(Test.options.system == 'cp' && data.indexOf('<<cs') > 0)
            next = true;
          else if(Test.options.system == 'cs' && data.indexOf('<<cp') > 0)
            next = true;
        }

        if(next)
          Test.testCommand(++Test.currentCommandIndex);
      }
    }
  },

  /**
   *
   */
  testCommand: function(index) {
    // if no command to test: end program
    if(Test.commands[index] == undefined) {
      process.exit(0);
      return;
    }

    var ptr = Test.commands[index].indexOf('remote_') > -1
            ? Test.centralSystem
            :  Test.chargePoint;

    ptr.stdin.write(Test.commands[index] +'\n');
  },

  /**
   *
   */
  test: function() {
    setTimeout(function() {
      Test.testStarted = true;
      Test.testCommand(Test.currentCommandIndex);
    }, 2000);
  }

};


exports.Test = Test;
