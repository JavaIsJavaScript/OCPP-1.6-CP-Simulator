#!/usr/bin/env node
// -*- coding: utf-8 -*-
"use strict"

var Test = require('./framework.js').Test;

// initialize
Test.init( { system: 'cs', version: '1.2' } );

// fill the array with the commands to test
Test.commands = [
  'remote_reset',
  'remote_changeconfiguration',
  'remote_starttransaction',
  'remote_stoptransaction',
  'remote_unlockconnector',
  'remote_getdiagnostics',
  'remote_changeavailability',
  'remote_updatefirmware',
  'remote_clearcache',
  'remote_starttransaction'
];

// process tests
Test.test();

