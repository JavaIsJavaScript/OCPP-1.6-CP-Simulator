"use strict"


var Utils = require('./utils.js'),
    OCPP = require('./ocpp-protocol.js');

/**
 *
 *
 *
 */

var Plugins = {

  plugins: {},

  PLUGINS_DIR: 'plugins/',

  // ref to Simulators
  Simulators: null,
  // ref to UI
  UI: null,

  /**
   *
   */
  API: {
    log: Utils.log,

    parse: function(line) {
      return Plugins.UI.commandToObject(Plugins.UI.parseLineToTokens(line));
    },

    cp: {
      call: function(procName, args) {
        setTimeout(function() {
          Plugins.escapeStringArguments(args);
          Plugins.Simulators.commandCPtoCS(-1, procName, args);
        }, 500);
      }
    },

    cs: {
      call: function(procName, args) {
        setTimeout(function() {
          Plugins.escapeStringArguments(args);
          Plugins.Simulators.commandCStoCP(-1, procName, args);
        }, 500);
      }
    },

    ocpp_version: null,
    system: null,
    protocol: null,
    chargePointId: null

  },

  /**
   *  TODO: give pointers
   *
   */
  init: function() {},

  /**
   *  TODO: give pointers
   *
   */
  setAPIFields: function(prot, system, version, cbId) {
    Plugins.API.protocol = prot;
    Plugins.API.system = system;
    Plugins.API.ocpp_version = version;
    Plugins.API.chargePointId = cbId;
  },

  /**
   *
   */
  load: function(filename) {
    // if already exist, unload it
    if(Plugins.plugins[filename] != undefined) {
      Plugins.unload(filename);
    }

    var plugin = null;
    try {
      plugin = require(__dirname + '/../' + Plugins.PLUGINS_DIR + filename +
        '.js');
    }
    catch(exception) {
      console.log('Error with the '+ filename +' plugin, invalid or '+
        'doesn\'t exist.');
      return;
    }

    // check if plugin is compliant
    if(!Plugins.isPluginCompliant(filename, plugin)) {
      // errors are printed in the isPluginCompliant function
      return;
    }

    //
    Plugins.addHandlers(plugin);

    // add to array
    Plugins.plugins[filename] = plugin;

    // create a special scope
    var scope = Utils.clone(Plugins.API);
    scope.onResult = plugin.onResult;
    scope.onCall = plugin.onCall;
    scope.onClientConnectionEvent = plugin.onClientConnectionEvent;
    scope.onCommand = plugin.onCommand;
    scope.onConnectionEvent = plugin.onConnectionEvent;
    scope.onIdle = plugin.onIdle;
    scope.unload = function() {
      Plugins.unload(filename);
    };

    // call the main function
    Plugins.plugins[filename].onLoad.call(scope);
  },

  /**
   *
   */
  unload: function(filename) {
    if(Plugins.plugins[filename] == undefined) {
      console.log('Error for unloading `'+ filename +'\': file does not exist.');
      return;
    }

    if(Plugins.plugins[filename].onUnload != undefined) {
      // call the unload function
      Plugins.plugins[filename].onUnload.call(Plugins.API);
    }

    // delete from array
    delete Plugins.plugins[filename];

    // delete from require cache
    delete require.cache[__dirname.replace('lib', '') + Plugins.PLUGINS_DIR +
      filename +'.js'];
  },

  /**
   *
   */
  addHandlers: function(plugin) {

    plugin.handlers = {
      onResultHandler: {},
      onCallHandler: {},
      onClientConnectionEventHandler: null,
      onCommandHandler: null,
      onConnectionEventHandler: null,
      onIdleHandler: null
    };

    plugin.onResult = function(procName, handlerFunc) {
      plugin.handlers.onResultHandler[procName] = handlerFunc;
    };

    plugin.onCall = function(procName, handlerFunc) {
      plugin.handlers.onCallHandler[procName] = handlerFunc;
    };

    plugin.onClientConnectionEvent = function(handlerFunc) {
      plugin.handlers.onClientConnectionEventHandler = handlerFunc;
    };

    plugin.onCommand = function(handlerFunc) {
      plugin.handlers.onCommandHandler = handlerFunc;
    };

    plugin.onConnectionEvent = function(handlerFunc) {
      plugin.handlers.onConnectionEventHandler = handlerFunc;
    };

    plugin.onIdle = function(handlerFunc) {
      plugin.handlers.onIdleHandler = handlerFunc;
    };
  },

  /**
   *
   */
  isPluginCompliant: function(filename, plugin) {
    // entry point
    if(plugin.onLoad == undefined) {
      console.log('Error when reading the `'+ filename +'\' plugin: '+
        'no entry point `onLoad\' function found.');
      return false;
    }

    return true;
  },

  /**
   *
   */
  callResultHandlers: function(procName, values, scope) {
    try {
      for(var pl in Plugins.plugins) {
        Plugins.plugins[pl].handlers.onResultHandler[procName]
          .call(scope, values);
      }
    } catch(e) {}
  },

  /**
   *
   */
  callHandlers: function(procName, values, scope) {
    var response;
    try {
      for(var pl in Plugins.plugins) {
        response = Plugins.plugins[pl].handlers.onCallHandler[procName]
          .call(scope, values);
      }
    } catch(e) {}

    return response;
  },

  /**
   *
   */
  callClientConnectionEventHandlers: function(type, cbId, scope) {
    try {
      for(var pl in Plugins.plugins) {
        Plugins.plugins[pl].handlers.onClientConnectionEventHandler
          .call(scope, type, cbId);
      }
    } catch(e) {}
  },

  /**
   *
   */
  callCommandHandlers: function(command, scope) {
    var ret = false;
    try {
      for(var pl in Plugins.plugins) {
        if(Plugins.plugins[pl].handlers.onCommandHandler.call(scope, command))
          ret = true;
      }
    } catch(e) {}

    return ret;
  },

  /**
   *
   */
  callConnectionEventHandlers: function(type, cbId, scope) {
    try {
      for(var pl in Plugins.plugins) {
        Plugins.plugins[pl].handlers.onConnectionEventHandler
          .call(scope, type, cbId);
      }
    } catch(e) {}
  },

  /**
   *
   */
  callIdleHandlers: function(scope) {
    try {
      for(var pl in Plugins.plugins) {
        Plugins.plugins[pl].handlers.onIdleHandler
          .call(scope);
      }
    } catch(e) {}
  },

  /**
   *  Escape string arguments.
   *    Example: {'status': 'Download'} -> {'status': '"Download"'}
   *
   *  This is mandoratory for JSON parsing functiona afterwards.
   */
  escapeStringArguments: function(args) {
    for(var arg in args) {
      if(typeof args[arg] == 'string') {
        args[arg] = '"'+ args[arg] +'"';
      }
    }
  },

};

module.exports = Plugins;

