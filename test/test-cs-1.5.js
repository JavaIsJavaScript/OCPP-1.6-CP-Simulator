#!/usr/bin/env node
// -*- coding: utf-8 -*-
"use strict"

var Test = require('./framework.js').Test;

// initialize
Test.init( { system: 'cs', version: '1.5' } );

// fill the array with the commands to test
Test.commands = [
  'remote_reset',
  'remote_changeconfiguration',
  'remote_starttransaction',
  'remote_stoptransaction',
  'remote_getlocallistversion',
  'remote_unlockconnector',
  'remote_getdiagnostics',
  'remote_cancelreservation',
  'remote_reservenow',
  'remote_changeavailability',
  'remote_updatefirmware',
  'remote_datatransfer',
  'remote_sendlocallist',
  'remote_clearcache',
  'remote_starttransaction',
  'remote_getconfiguration'
];

// process tests
Test.test();

