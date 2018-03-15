"use strict"

/**
 *
 *
 *
 */

var UI = require('./ui.js'),
    OCPP = require('./ocpp-protocol.js'),
    Utils = require('./utils.js');

function main() {
  // if arguments in shell
  if(process.argv.length > 2) {
    var args = process.argv.slice(2);

    // non-documented option
    for(var i = 0; i < args.length; i++) {
      if(args[i] == '--with-attr-at') {
        OCPP.enableAttributesWithAt();
        args.splice(i, 1);
        break;
      }
    }

    if (UI.parseCommand(args) == -1) {
      // if error just print the usage and quit
      UI.rl.close();
      return;
    }
  }
  else {
    console.log("== GIR ocppjs - OCPP CentralSystem & ChargePoint Simulator ==");
    console.log(" > Quick start :");
    UI.getHelp();
  }

  // read WSDL files and fill the data structures
  OCPP.readWSDLFiles();
  OCPP.buildJSONSchemas();

  // launch the command line interface
  UI.commandLine();
}

exports.main = main;

