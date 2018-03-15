"use strict"

/**
 *
 *
 *
 */



var readline = require('readline'),
    fs = require('fs');


var OCPP = require('./ocpp-protocol.js'),
    Utils = require('./utils.js'),
    Simulators = require('./simulators.js'),
    Transport = require('./transport.js'),
    Plugins = require('./plugins.js');

var UI = {

  /**
   *  IMPORTANT: optional field must be prefixed by -
   */
  commands: {

    /*
    command: {
      options: {
        mandatory: {
          'option': 'description'
        },
        optional: {
          '-o': 'description'
        }
      },
      func: function(args) {

      }
    }
    */

    start_cs: {
      options: {
        mandatory: {
          'port': 'port',
        },
        optional: {
          '-i': 'websocket ping interval, default: '+
            OCPP.HEARTBEAT_INTERVAL,
          '-u': 'endpoint URL, default: '+ OCPP.ENDPOINTURL,
          '-p': 'websocket subprotocol, default: '+ OCPP.SUB_PROTOCOL,
          '-t': 'transport layer mode (websocket or soap), default: '+
            Transport.TRANSPORT_LAYER
        }
      },
      func: function(args) {
        if(Simulators.centralSystem != null) {
          Utils.log("Central System already started.");
          return;
        }

        var port = args['port'];
        OCPP.KEEP_ALIVE_INTERVAL = args['-i'] ||
          OCPP.KEEP_ALIVE_INTERVAL;
        OCPP.ENDPOINTURL = args['-u'] || OCPP.ENDPOINTURL;

        if(args['-p'] != undefined) {
          if(args['-p'].indexOf(',') > -1)
            OCPP.SUB_PROTOCOL = args['-p'].split(',');
          else
            OCPP.SUB_PROTOCOL = [args['-p']];
        }

        Transport.TRANSPORT_LAYER = args['-t'] || Transport.TRANSPORT_LAYER;

        Simulators.centralSystem = new Simulators.CentralSystemSimulator(port,
          Transport.TRANSPORT_LAYER);
        Utils.log("CentralSystem started.");
      }
    },

    start_cp: {
      options: {
        mandatory: {
          'url': 'url, ex: http://localhost:9000/simulator',
          'identifier': 'boxid01'
        },
        optional: {
          '-p': 'websocket subprotocol, default: '+ OCPP.SUB_PROTOCOL,
          '-i': 'websocket ping interval (use 0 for disabling), default: '+
            OCPP.KEEP_ALIVE_INTERVAL,
          '-t': 'transport layer mode (websocket or soap), default: '+
            Transport.TRANSPORT_LAYER,
          '-f': 'In SOAP mode, value for FROM header.',
          '-r': 'In SOAP mode, define the port for remote actions.'
        }
      },
      func: function(args) {
        var protocol = OCPP.SUB_PROTOCOL = args['-p'] || "ocpp1.5";
        OCPP.KEEP_ALIVE_INTERVAL = parseInt(args['-i'], 10)
          || OCPP.KEEP_ALIVE_INTERVAL;

        Transport.TRANSPORT_LAYER = args['-t'] || Transport.TRANSPORT_LAYER;
        // In SOAP mode
        Transport.retrieveIPAddress();
        var fromHeader = args['-f'],
            remoteActionPort = args['-r'] || Transport.retrievePort(fromHeader);

        var cp = new Simulators.ChargePointSimulator(args['url'],
          args['identifier'], protocol, Transport.TRANSPORT_LAYER,
          {
            fromHeader: fromHeader,
            remoteActionPort: remoteActionPort
          });
        Simulators.chargePoints[cp.chargePointId] = cp;
      }
    },

  /*
    status: {
      func: function(args) {
        if (centralSystem == null)
          return;

        console.log("+ Central System on port " + centralSystem._port);
        for(var i in chargePoints) {
          console.log("|-- Charge Point #"+ i);
        }
      }
    },
  */

    help: {
      func: function(args) {
        console.log("Available commands : ");
        var n = UI.getHelp();

        // don't print the N first ones
        var i = 0;
        for(var c in UI.commands) {
          if(i++ < n)
            continue;

          console.log(' - '+ c);
        }

        console.log(" - quit");
      }
    },

    set: {
      options:{
        mandatory:{
          'cs|cp': 'change target configuration, value: `cs` or `cp`'
        },
        optional:{}
      },
      func: function(args) {
        if(Utils.isEmpty(args.custom)) {
          console.log('Error for command "set": syntax: set <cs|cp> '
            +'variable=value ...');
          console.log('Supported settings:');
          console.log('- websocket_ping_interval=<number> : set the websocket'+
            ' ping interval (0 for disabling).');
          console.log('- print_xml=<boolean> : in SOAP mode, print the raw '+
            'SOAP content.');
          return;
        }

        // keepalive_interval, only supported feature at the moment

        // if keepalive_interval
        if(args.custom.websocket_ping_interval != undefined) {
          var interval = args.custom.websocket_ping_interval;
          if(isNaN(interval)) {
            console.log('Error: argument provided for websocket_ping_interval'+
              ' is not a number.');
            return;
          }

          // if central system
          if(args['cs|cp'] == 'cs') {
            if (Simulators.centralSystem != null) {
              Simulators.centralSystem.transportLayer.layer
                .setWebSocketPingInterval(interval);
            }
            else {
              console.log('Error, no central system detected in this simulator.');
            }
          }

          // if charge points
          if (args['cs|cp'] == 'cp') {
            if(!Utils.isEmpty(Simulators.chargePoints)) {
              for(var cp in Simulators.chargePoints) {
                Simulators.chargePoints[cp].transportLayer.layer
                  .setWebSocketPingInterval(interval);
              }
            }
            else {
              console.log('Error, no charge points detected in this simulator.');
            }
          }
        }

        // if print_xml
        if(args.custom.print_xml != undefined) {
          Transport.PRINT_XML = args.custom.print_xml == 'true';
        }
      }
    },

    send_raw: {
      options: {
        optional: {
          '--id': 'id of charge point',
          '-e': 'whole envelope of the message without spaces',
          '-h': 'print headers (true of false)'
        }
      },
      func: function(args) {
        // if soap, disable
        /*if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send_raw command in SOAP mode.');
          return;
        }*/
        Transport.PRINT_HEADERS = !!(args['-h'] && args['-h'] == 'true');

        var cpId = args['--id'] || -1;
        if(args['-e'] == undefined) {
          Utils.log('Error for command "send": syntax: send_raw -e <envelope>');
          return;
        }
        Simulators.commandCPtoCS(cpId, '', args['-e']);
      }
    },

    send: {
      options: {
        optional: {
          '--id': 'id of charge point',
          '-n': 'procedure name',
          '-p': 'payload'
        }
      },
      func: function(args) {
        // if soap, disable
        if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send command in SOAP mode.');
          return;
        }

        var cpId = args['--id'] || -1;
        if(args['-n'] == undefined || args['-p'] == undefined) {
          Utils.log('Error for command "send": syntax: send -n <procedure name>'+
            ' -p <payload>');
          return;
        }

        Simulators.commandCPtoCS(cpId, args['-n'], args['-p']);
      }
    },

    load: {
      options: {
        mandatory: {
          'filename': 'filename of the plugin without the extension'
        }
      },
      func: function(args) {
        Plugins.load(args['filename']);
      }
    },

    unload: {
      options: {
        mandatory: {
          'filename': 'filename of the plugin without the extension'
        }
      },
      func: function(args) {
        Plugins.unload(args['filename']);
      }
    },

    plugins: {
      options: {},
      func: function(args) {
        console.log('List of plugins:');
        var path = __dirname +'/../plugins/',
            files = fs.readdirSync(path);

        for(var file in files) {
          if(files[file].indexOf('.js') == -1)
            continue;

          var pluginFile = files[file].replace('.js', ''),
              enabled = Plugins.plugins[pluginFile] ?
                ' [X] ' : ' [ ] ';

          // dont display hidden file
          if(pluginFile[0] != '.')
            console.log(enabled + pluginFile);
        }
      }
    },

    remote_send_raw: {
      options: {
        optional: {
          '--remote-id': 'id of charge point',
          '-e': 'whole envelope of the message without spaces',
          '-h': 'print http headers (true of false)'
        }
      },
      func: function(args) {
        // if soap, disable
        /*if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send command in SOAP mode.');
          return;
        }*/
        Transport.PRINT_HEADERS = !!(args['-h'] && args['-h'] == 'true');

        var cpId = args['--remote-id'] || -1;
        if(args['-e'] == undefined) {
          Utils.log('Error for command "send": syntax: remote_send_raw'+
            ' -e <envelope>');
          return;
        }
        Simulators.commandCStoCP(cpId, '', args['-e']);
      }
    },

    remote_send: {
      options: {
        optional: {
          '--remote-id': 'id of charge point',
          '-n': 'procedure name',
          '-p': 'payload'
        }
      },
      func: function(args) {
        // if soap, disable
        if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send command in SOAP mode.');
          return;
        }

        var cpId = args['--remote-id'] || -1;
        if(args['-n'] == undefined || args['-p'] == undefined) {
          Utils.log('Error for command "send": syntax: remote_send -n '+
            '<procedure name> -p <payload>');
          return;
        }

        Simulators.commandCStoCP(cpId, args['-n'], args['-p']);
      }
    },

    /* */

    bootnotification: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "BootNotification", values);
      }
    },

    heartbeat: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "Heartbeat", values);
      }
    },

    metervalues: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "MeterValues", values);
      }
    },

    starttransaction: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "StartTransaction", values);
      }
    },

    stoptransaction: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "StopTransaction", values);
      }
    },

    statusnotification: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "StatusNotification", values);
      }
    },

    authorize: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "Authorize", values);
      }
    },

    firmwarestatusnotification: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "FirmwareStatusNotification", values);
      }
    },

    diagnosticsstatusnotification: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "DiagnosticsStatusNotification", values);
      }
    },

    datatransfer: {
      options: {
        optional: {
          '--id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--id'] || -1;
        Simulators.commandCPtoCS(cpId, "DataTransfer", values);
      }
    },

    websocket_ping_cs: {
      options: {
        optional: {
          '--id': 'id of charge point'
        }
      },
      func: function(args, values) {
        // if soap, disable
        if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send command in SOAP mode.');
          return;
        }

        var cpId = args['--id'] || -1;
        // not a true OCPP command
        Simulators.commandCPtoCS(cpId, "WebSocketPing", values);
      }
    },

    websocket_ping_cp: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        // if soap, disable
        if(Transport.TRANSPORT_LAYER == 'soap') {
          console.log('Cannot use send command in SOAP mode.');
          return;
        }

        var cpId = args['--remote-id'] || -1;
        // not a true OCPP command
        Simulators.commandCStoCP(cpId, "WebSocketPing", values);
      }
    },

    remote_reset: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "Reset", values);
      }
    },

    remote_unlockconnector: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "UnlockConnector", values);
      }
    },

    remote_changeavailability: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "ChangeAvailability", values);
      }
    },

    remote_clearcache: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "ClearCache", values);
      }
    },

    remote_changeconfiguration: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "ChangeConfiguration", values);
      }
    },

    remote_getdiagnostics: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "GetDiagnostics", values);
      }
    },

    remote_updatefirmware: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "UpdateFirmware", values);
      }
    },

    remote_starttransaction: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "RemoteStartTransaction", values);
      }
    },

    remote_stoptransaction: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "RemoteStopTransaction", values);
      }
    },

    remote_cancelreservation: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "CancelReservation", values);
      }
    },

    remote_datatransfer: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "DataTransfer", values);
      }
    },

    remote_getconfiguration: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "GetConfiguration", values);
      }
    },

    remote_getlocallistversion: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "GetLocalListVersion", values);
      }
    },

    remote_reservenow: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "ReserveNow", values);
      }
    },

    remote_sendlocallist: {
      options: {
        optional: {
          '--remote-id': 'id of remote charge point'
        }
      },
      func: function(args, values) {
        var cpId = args['--remote-id'] || -1;
        Simulators.commandCStoCP(cpId, "SendLocalList", values);
      }
    }

  },


  /**
   */
  parseCommand: function(line, centralSystem, chargePoints) {
    var value = null;

    // if it's a known command
    if(UI.commands[line[0]] != undefined) {
      var args = UI.argumentsToArray(line);

      // if error
      if(args == -1) {
        var cmd = line[0];
        for(var m in UI.commands[line[0]].options.mandatory) {
          cmd += ' <'+ m + '>';
        }
        var optionals = UI.commands[line[0]].options.optional;
        if(optionals != undefined) {
          cmd += '\nWith optional arguments:\n';
          for(var o in optionals) {
            cmd += '  '+ o+ ' : '+ optionals[o] +'\n';
          }
        }
        Utils.log('Error in command "'+ line[0] +'", syntax: '+ cmd);
        return -1;
      }

      UI.commands[line[0]].func(args, args.custom, centralSystem, chargePoints);
    }
    else {
      console.log("Error: `"+ line[0] +"' unknown command. Type help for more"+
        " informations.");
      return -1;
    }

  },

  /**
   */
  argumentsToArray: function(args) {
    var cmd = args[0],
        ret = { custom: {} },
        prot = Utils.retrieveVersion(OCPP.SUB_PROTOCOL);

    if(UI.commands[cmd].options == undefined)
      return ret;

    var i = 1; // first after the cmd

    try {
      // Retrieve mandatory arguments
      var mands = UI.commands[cmd].options.mandatory;
      for(var m in mands) {
        if(args[i][0] != '-')
          ret[m] = args[m[0] == '-' ? ++i : i++]; // if --arg next else current
        else
          throw "";
      }

      // Retrieve optional arguments
      for( ; i < args.length; i++) {
        if (UI.commands[cmd].options.optional[args[i]] != undefined
          && args[i + 1] != undefined && args[i + 1][0] != '-')
          ret[args[i]] = args[++i];
        // if argument of type argument=value for payload customization
        else if(args[i].indexOf('=') > 0) { // don't start with =
          var tokens = args[i].split('='),
              argument = tokens[0],
              value = tokens[1];

          ret.custom[argument] = value;
        }
        else {
          throw "";
        }
      }
    } catch (e) {
      ret = -1;
    }

    return ret;
  },

  /**
   *  Command line completer
   */
  completer: function(line) {
    var completions = [];
    for(var c in UI.commands) {
      completions.push(c);
    }
    var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
    return [hits.length ? hits : completions, line]
  },


  /**
   *  Help
   */
  getHelp: function() {
    console.log(" - start_cs <port> [options] .ex: start_cs 9000 -u /simulator");
    console.log(" - start_cp <url> <id> .ex: "+
      "start_cp ws://localhost:9000/simulator id01");
    /* console.log(" - status"); */
    console.log(" - help");
    return 3;
  },

  /**
   *  Simple automata for converting a line to tokens.
   *  Handle string and remove useless spaces
   *
   */
  parseLineToTokens: function(line) {
    var arr = [],
        tmp = "",
        in_string = false;

    for(var c in line) {
      if(line[c] == " " && !in_string) {
        if (tmp != "") {
          arr.push(tmp);
          tmp = "";
        }
        continue;
      }

      if(line[c] == '"') {
        in_string = !in_string;
      }

      tmp += line[c];
    }

    if (tmp != "")
      arr.push(tmp);

    return arr;
  },

  commandToObject: function(lineArray) {
    var cmd = {
          command: '',
          arguments: [],
          options: {}
        },
        i = 0;

    // command = first token
    cmd.command = lineArray[i++];

    var x = i;
    for( ; x < lineArray.length; x++) {
      if(lineArray[x][0] == '-') {
        cmd.options[lineArray[x]] = lineArray[++x];
      }
      else {
        cmd.arguments.push(lineArray[x]);
      }
    }

    return cmd;
  },

  /**
   *
   */

  commandLine: function() {
    rl.setPrompt("> ");
    rl.prompt();

    rl.on("line", function(line) {
      var lineRaw = line;
      line = UI.parseLineToTokens(line);

      if(line.length == 0) {
        rl.prompt();
        return;
      }

      // strips \n
      line[0] = line[0].replace('\n', '');

      if(line[0] == "quit")
        rl.close();

      if(!Plugins.callCommandHandlers(lineRaw, line))
        UI.parseCommand(line);

      rl.prompt();
    }).on("close", function() {
      Utils.log("End of simulation : interrupted by user.");
      process.exit(0);
    }).on('SIGTSTP', function() {
      // This will override SIGTSTP and prevent the program from going to the
      // background.
      //console.log('Caught SIGTSTP.');
      rl.prompt();
    });
  }

};


Plugins.UI = UI;

var rl = readline.createInterface(process.stdin, process.stdout, UI.completer);

UI.rl = rl;

module.exports = UI;

