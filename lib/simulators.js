"use strict"

/**
 *
 *
 *
 */


var OCPP = require('./ocpp-protocol.js'),
    Utils = require('./utils.js'),
    Transport = require('./transport.js'),
    Plugins = require('./plugins.js');

/**
 *  Central System Simulator constructor.
 *
 * - {CentralSystemSimulator} implements an OCPP Central System.
 *   Constructor options: TCP port.
 *   When started, a CentralSystemSimulator creates a {WebSocketServer} on the
 *   specified port.
 *   When the WebSocketServer receives a connection request, a
 *   {WebSocketConnection} is created (by the websocket lib).
 *   The CentralSystemSimulator uses this connection to create:
 *   - a {SRPCServerConnection}, to handle RPC calls
 *   - a {SRPCClientConnection}, to emit RPC calls
 *
 *  @param {int} Port
 *  @return {CentralSystemSimulator}
 *  @api public
 */

function CentralSystemSimulator(port, transport) {
  this.port = port;
  this._wsServer = null;

  this._connections = {};

  Plugins.setAPIFields(transport, 'cs', OCPP.SUB_PROTOCOL);

  this.transportLayer = new Transport.TransportLayerServer(this,
    transport, 'cs', 'server');

  // lib fonction redefinitions
  // TODO move this to transport.js, can't at the moment because of circular
  // require
  var _this = this;
  if(transport == 'soap') {
    this.transportLayer.layer.soapServ.setRemoteAddress =
      function(cbId, address, action) {
        // if not bootnotification, stop
        if(action != 'BootNotification')
          return;

        Plugins.callClientConnectionEventHandlers('connected', cbId, this);

        Utils.log('ChargePoint #'+ cbId +' connected.', 'cs');
        _this._connections[cbId] = {
          client: new Transport.TransportLayerClient(this,
            transport, 'cs', 'client', { fromHeader: address }).layer
        };
      };

    this.transportLayer.layer.soapServ.log = logSoap;
    this.transportLayer.layer.soapServ.postProcess
      = function() { Plugins.callIdleHandlers(this); };
  }
};

CentralSystemSimulator.prototype = {

  /**
   *  Stop the CentralSystem
   *

  stop: function() {
    this._wsServer.closeAllConnections();
    this._wsServer.shutDown();
    this._wsServer = null;

    this._httpServer.close();
    this._httpServer = null;
  },
   */

  /*
   *  Calls a remote procedure
   *
   *  @param {Number} the client ID
   *  @param {String} the procedure URI
   *  @api public
   */
  remoteAction: function(clientId, procName, args) {
    var prot = Utils.retrieveVersion(OCPP.SUB_PROTOCOL);

    if(this._connections[clientId] == undefined) {
      Utils.log("Error: charge point #"+ clientId +" does not exist");
      return;
    }

    var resultFunction = function(){};

    if(procName != '') {
      if(OCPP.procedures[prot]['cp'][procName] != undefined
      && OCPP.procedures[prot]['cp'][procName].resultFunction != undefined) {
        resultFunction = OCPP.procedures[prot]['cp'][procName].resultFunction;
      }
    }

    this._connections[clientId].client.rpcCall(procName, args || {},
      OCPP.TIMEOUT, resultFunction, {to: "cp#" + clientId});
  }

};

/**
 *  Charge Point Simulator constructor.
 *
 * - {ChargePointSimulator} implements an OCPP Charge Point.
 *   Constructor options: server URL.
 *   A ChargePointSimulator permanently trys to connect to its CentralSystem,
 *   with a {WebSocketClient}. On successfull connection, a
 *   {WebSocketConnection} is created (by the websocket lib).
 *   The ChargePointSimulator uses this connection to create:
 *   - a {SRPCServerConnection}, to handle RPC calls
 *   - a {SRPCClientConnection}, to emit RPC calls
 *
 *  @param {String} URI
 *  @return {ChargePointSimulator}
 *  @api public
 */

function ChargePointSimulator(uri, identifier, protocol, transport,
  soapOptions) {
  this.uri = uri;
  this.protocol = protocol || "ocpp1.6";
  this.transport = transport;

  this.chargePointId = identifier;
  this.clientConnection = null;

  Plugins.setAPIFields(transport, 'cp', OCPP.SUB_PROTOCOL, this.chargePointId);

  this.transportLayer = new Transport.TransportLayerClient(this,
    transport, 'cp', 'client', soapOptions);

  if(this.transport == 'soap') {
    this.transportLayer.layer.soapServ.log = logSoap;
    this.transportLayer.layer.soapServ.postProcess
      = function() { Plugins.callIdleHandlers(this); };
  }
};

ChargePointSimulator.prototype = {

  /**
   *  Calls a client procedure
  *
   *  @param {String} Procedure URI
   *  @param {Array} Arguments
   */
  clientAction: function(procUri, args) {
    var resultFunction = function(){},
        version = Utils.retrieveVersion(this.transportLayer.simulator.protocol);

    if(OCPP.procedures[version]['cs'][procUri] != undefined
      && OCPP.procedures[version]['cs'][procUri].resultFunction != undefined)
      resultFunction = OCPP.procedures[version]['cs'][procUri].resultFunction;

    if(this.clientConnection)
      this.clientConnection.rpcCall(procUri, args, OCPP.TIMEOUT,
        resultFunction, {to: "cs"});
    else
      console.log('Error: not connected to any central system.');
  }

};

/**
 *
 *
 */
function commandCPtoCS(cpId, procName, args) {
  var prot = Utils.retrieveVersion(OCPP.SUB_PROTOCOL);

  if(cpId == -1) {
    cpId = Utils.getId(Simulators.chargePoints);

    if(cpId == -1) {
      console.log("Error: cannot use shortened command : there is no or more"+
        " than one charge point connected.");
      return;
    }
  }

  if(Simulators.chargePoints[cpId] == undefined) {
    Utils.log("Error: charge point #"+ cpId +" does not exist.");
    return;
  }

  // specific case: WebSocket Ping
  if(procName == "WebSocketPing") {
    if(Simulators.chargePoints[cpId].clientConnection != undefined)
      Simulators.chargePoints[cpId].clientConnection._connection._connection
        .ping();
    return;
  }

  // if charge point protocol is 1.2
  if(prot == '1.2') {
    if(OCPP.wsdl[prot][procName + 'Request'] == undefined) {
      console.log("Error: procedure `"+ procName +"' is not available for a"+
        " OCPP 1.2 Charge Point Simulator");
      return;
    }
  }

  // if send or send_raw
  var values = typeof args == 'string' ?
    args :
    OCPP.getRequestValues(procName, args);

  // if error
  if(values == -1)
    return;


  Simulators.chargePoints[cpId].clientAction(procName, values);
};


/**
 *
 *
 */
function commandCStoCP(cpId, procName, args) {
  var prot = Utils.retrieveVersion(OCPP.SUB_PROTOCOL); 

  if(cpId == -1) {
    if (Simulators.centralSystem != null)
      cpId = Utils.getId(Simulators.centralSystem._connections);

    if(cpId == -1) {
      console.log("Error: cannot use shortened command : there is no or more"+
        " than one charge point connected.");
      return;
    }
  }

  // if cp does not exit
  if(Simulators.centralSystem._connections[cpId] == undefined) {
    Utils.log("Error: remote charge point #"+ cpId +" does not exist.");
    return;
  }

  // if charge point protocol is 1.2
  if(prot == '1.2') {
    if(OCPP.wsdl[prot][procName + 'Request'] == undefined) {
      console.log("Error: procedure `"+ procName +"' is not available for a"+
        " OCPP 1.2 Charge Point Simulator");
      return;
    }
  }

  // specific case: WebSocket Ping
  if(procName == "WebSocketPing") {
    if(Simulators.centralSystem._connections[cpId].client != undefined)
      Simulators.centralSystem._connections[cpId]
        .client._connection._connection.ping();
    return;
  }

  var values = OCPP.getRequestValues(procName, args);

  // if error
  if(values == -1)
    return;

  Simulators.centralSystem.remoteAction(cpId, procName, values);
};


/**
 *
 *
 */

function logSoap(xml, direction) {
  // @scope: soap server
  var direction = direction || 'in',
      prefix = direction == 'in' ? '<<' : '>>',
      rawContent = xml,
      content = this.wsdl.xmlToObject(xml),
      from = null,
      action = null;

  // if no content then do nothing
  if(!content) {
    if(direction == 'in')
      Utils.log('<<cp#? Error, message not well-formed:\n'+
        xml, "cs");
    return;
  }

  if(content.Header && content.Header.chargeBoxIdentity) {
    from = content.Header.chargeBoxIdentity;
    action = content.Header.Action;
  }

  // get message content
  for(var c in content.Body) { content = content.Body[c]; break; };

  content = Transport.PRINT_XML ? rawContent : JSON.stringify(content);
  Utils.log(prefix + 'cp#'+ from +' '+ action  +' '+ content,
    "cs");
}


/**
 *
 *
 */

var Simulators = {
  chargePoints: {},
  centralSystem: null,

  ChargePointSimulator: ChargePointSimulator,
  CentralSystemSimulator: CentralSystemSimulator,

  commandCStoCP: commandCStoCP,
  commandCPtoCS: commandCPtoCS
};

// forward references
Transport.initReferences(Simulators);


module.exports = Simulators;

