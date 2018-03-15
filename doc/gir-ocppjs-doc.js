/*
 *  XML-to-JSON program
 *  The purpose of this program is to generate JSON examples from
 *  a given XML-Schema
 */
'use strict'

var fs = require('fs'),
    xml2js = require('xml2js'),
    OCPP = require('../lib/ocpp-protocol.js'),
    Utils = require('../lib/utils.js');


var VERSION;
var FILE;
var TYPE;
var methodTree;

var parser = new xml2js.Parser();

var parseWSDL = function(err, data) {
  parser.parseString(data, function (err, result) {
    var messages = [];

    // if the `attribute @` option is enabled, replace the example
    if(OCPP.WITH_ATTR_AT) {
      OCPP.enableAttributesWithAt();
    }

    // JSON Schemas
    OCPP.buildJSONSchemas();
    var schemaTree = OCPP.JSONSchemas[VERSION][TYPE];

    // fetch all the messages
    var msg = result['wsdl:definitions']['wsdl:message'];
    for (var m in msg) {
      var message = msg[m]['wsdl:part'][0]['$'].element;

      // only push request and response
      if (message.indexOf('Request') > 0 || message.indexOf('Response') > 0)
        messages.push(Utils.deleteNamespace(message));
    }

    // for all the messages
    for (var i in messages) {

      var name = Utils.capitaliseFirstLetter(messages[i]);
      var args = OCPP.wsdl[VERSION][name];

      // print
      if (messages[i].indexOf('Request') > 0) {
        console.log('<h3>'+
          name.replace('Request', '')
          +'</h3>');
        console.log('<ul><li>Request example:');
        console.log('<pre>');
        console.log(JSON.stringify(args, null, 2));
        console.log('</pre></li>');
      }
      else {
        var methodName = name.replace('Response', '');

        console.log('<li>Response example:');
        console.log('<pre>');
        console.log(JSON.stringify(args, null, 2));
        console.log('</pre></li>');

        console.log('<li>Request schema:');
        console.log('<pre>');
        console.log(JSON.stringify(schemaTree[methodName + 'Request'],
				   null, 2));
        console.log('</pre></li>');

        console.log('<li>Response schema:');
        console.log('<pre>');
        console.log(JSON.stringify(schemaTree[methodName + 'Response'],
				   null, 2));
        console.log('</pre></li></ul>');
      }
    }

  });
};

function main() {
  var args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node gir-ocpp-doc.js <wsdl file>\n\n')
    return;
  }

  /* non-documented option */
  if(args[1] && args[1] == "--with-attr-at"){
    OCPP.WITH_ATTR_AT = true;
  }

  VERSION = Utils.retrieveVersion(args[0]);
  FILE = args[0];
  
  TYPE = "cp";
  if(FILE.search("centralsystem") != -1)
    TYPE = "cs";

  var vers = TYPE +"_"+ VERSION;

  OCPP.readFile(vers, FILE);
  methodTree = OCPP.methodTree[VERSION][TYPE];

  fs.readFile(FILE, parseWSDL);
}

main();

