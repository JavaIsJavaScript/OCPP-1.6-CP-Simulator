"use strict"

/**
 *
 *
 *
 */


var fs = require('fs'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser(),
    JaySchema = require('jayschema'),
    js = new JaySchema();


var Utils = require('./utils.js');


/**
 *
 *
 */


var OCPP = {


  SUB_PROTOCOL: ["ocpp1.2", "ocpp1.6"],
  VERSIONS: ["1.2", "1.6"],
  SYSTEMS: ["cs", "cp"],
  TRY_INTERVAL: 10, // seconds
  TIMEOUT: 30, // seconds

  KEEP_ALIVE_INTERVAL: 0, // seconds, 0 by default, must be specified by user
  HEARTBEAT_INTERVAL: 300, // seconds

  ENDPOINTURL: "/",

  WITH_ATTR_AT: false,

  // Heartbeat = true
  // Websocket ping = false
  WITH_HEARTBEAT: false,
  WSDL_FILES: {
    "cs_1.2": "doc/wsdl/ocpp_centralsystemservice_1.2_final.wsdl",
    "cp_1.2": "doc/wsdl/ocpp_chargepointservice_1.2_final.wsdl",
    "cs_1.6": "doc/wsdl/ocpp_centralsystemservice_1.6_final.wsdl",
    "cp_1.6": "doc/wsdl/ocpp_chargepointservice_1.6_final.wsdl"
  },


  /**
   *  Message Types from OCPP SRPC over WebSocket specifications
   */

  protocolID: {
    "TYPE_ID_CALL": 2,
    "TYPE_ID_CALL_RESULT": 3,
    "TYPE_ID_CALL_ERROR": 4
  },


  /**
   *  Procedures supported by the simulator according to OCPP 1.6.
   *
   *  resultFunction: Callback functions to process after receiving
   *   the server's response. If there's no resultFunction: replaced by
   *   a simple function(){} in code.
   *
   *  handlerFunction: Called whenever the server receives a RPC call.
   *   If there's no handlerFunction: replaced by prefilled values.
   *
   *   @param {Object} Call Message sent by client
   *   @return {Object} Call return arguments
   *
   */
  procedures: {

    /* Example:
    "procedure name": {
      resultFunction: new ResultFunction({
        onSuccess: function(args) {}
      }),

      handlerFunction: function(message) {
        return {
          currentTime: new Date().toISOString(),
        };
      }
    },
    */


    "1.2": {

      "cs": {

        "Authorize": {},

        "BootNotification": {
          resultFunction: new ResultFunction({
            onSuccess: function(args) {
              var heartbeat = args.heartbeatInterval;

              function heartBeatInterval(scope) {
                var scope = scope[0];
                scope.rpcCall("Heartbeat", {}, OCPP.TIMEOUT,
                  results["Heartbeat"], {to: "cs"});

                setTimeout(heartBeatInterval, heartbeat * 1000, [scope]);
              }

              if(OCPP.WITH_HEARTBEAT)
                setTimeout(heartBeatInterval, heartbeat * 1000, [this]);
            }
          })
        },

        "DiagnosticsStatusNotification": {},

        "FirmwareStatusNotification": {},

        "Heartbeat": {
          handlerFunction: function(message) {
            return {
              currentTime: new Date().toISOString(),
            };
          }
        },

        "MeterValues": {},
        "StatusNotification": {},
        "StartTransaction": {},
        "StopTransaction": {},

      },

      "cp": {

        "ChangeAvailability": {},
        "ChangeConfiguration": {},
        "ClearCache": {},

        "GetDiagnostics": {},

        "RemoteStartTransaction": {},
        "RemoteStopTransaction": {},
        "Reset": {},
        "UnlockConnector": {},

        "UpdateFirmware": {},
		
		"TriggerMessage": {},
		"ClearChargingProfile": {},
		"GetCompositeSchedule": {},

      }

    },

    "1.6": {

      "cp": {

        "CancelReservation": {},
        "ChangeAvailability": {},
        "ChangeConfiguration": {},
        "ClearCache": {},
        "DataTransfer": {},
        "GetConfiguration": {},
        "GetLocalListVersion": {},
        "GetDiagnostics": {},
        "UnlockConnector": {},
        "UpdateFirmware": {},
        "ReserveNow": {},
        "Reset": {},
        "RemoteStartTransaction": {},
        "RemoteStopTransaction": {},
        "SendLocalList": {},
		"TriggerMessage": {},
		"ClearChargingProfile": {},
		"GetCompositeSchedule": {},

      },

      "cs": {

        "Authorize": {},

        "BootNotification": {
          resultFunction: new ResultFunction({
            onSuccess: function(args) {
              var heartbeat = args.heartbeatInterval;

              function heartBeatInterval(scope) {
                var scope = scope[0];
                scope.rpcCall("Heartbeat", {}, OCPP.TIMEOUT,
                  results["Heartbeat"], {to: "cs"});

                setTimeout(heartBeatInterval, heartbeat * 1000, [scope]);
              }

              if(OCPP.WITH_HEARTBEAT)
                setTimeout(heartBeatInterval, heartbeat * 1000, [this]);
            }
          })
        },

        "DiagnosticsStatusNotification": {},
        "FirmwareStatusNotification": {},
        "Heartbeat": {},
        "MeterValues": {},
        "StatusNotification": {},
        "StartTransaction": {},
        "StopTransaction": {},
        "DataTransfer": {}
      }
    }
  },


  /**
   *  Prefilled values
   */
  wsdl: {

    "1.6": {

      BootNotificationRequest: {
        chargePointVendor: 'DBT',
        chargePointModel: 'NQC-ACDC',
        chargePointSerialNumber: 'gir.vat.mx.000e48',
        chargeBoxSerialNumber: 'gir.vat.mx.000e48',
        firmwareVersion: '1.0.49',
        iccid: '',
        imsi: '',
        meterType: 'DBT NQC-ACDC',
        meterSerialNumber: 'gir.vat.mx.000e48'
      },

      BootNotificationResponse: {
        status: 'Accepted',
        currentTime: '2013-02-01T15:09:18Z',
        heartbeatInterval: 1200
      },

      StatusNotificationRequest: {
        connectorId: 2,
        status: 'Available',
        errorCode: 'NoError',
        info: "",
        timestamp: "2013-02-01T15:09:18Z",
        vendorId: "",
        vendorErrorCode:""
      },

      StatusNotificationResponse: {},

      AuthorizeRequest: {
        idTag: 'B4F62CEF'
      },

      AuthorizeResponse: {
        idTagInfo: {
          status: 'Accepted',
          expiryDate: '2013-02-01T15:09:18Z',
          parentIdTag: 'PARENT'
        }
      },

      HeartbeatRequest: {},

      HeartbeatResponse: {
        currentTime:"2013-02-01T15:09:18Z"
      },

      StartTransactionRequest: {
        connectorId: 2,
        idTag: 'TAG1',
        timestamp: "2018-03-02T15:09:18Z",
        meterStart: 0,
      },

      StartTransactionResponse: {
        transactionId: 0,
        idTagInfo: {
          status: 'Accepted',
          expiryDate: "2013-02-01T15:09:18Z",
          parentIdTag: 'PARENT'
        }
      },

      MeterValuesRequest: {
        connectorId: 2,
        meterValue: [
          {
            "timestamp": "2013-03-07T16:52:16Z",
            "sampledValue": [
              {
                "value": "0",
                "unit": "Wh",
                "measurand": "Energy.Active.Import.Register" 
              },
              {
                "value": "0",
                "unit": "varh",
                "measurand": "Energy.Reactive.Import.Register" 
              }
            ]
          },{
            "timestamp": "2013-03-07T19:52:16Z",
            "sampledValue": [
              {
                "value": "20",
                "unit": "Wh",
                "measurand": "Energy.Active.Import.Register" 
              },
              {
                "value": "20",
                "unit": "varh",
                "measurand": "Energy.Reactive.Import.Register" 
              }
            ]
          }
        ]
      },

      MeterValuesResponse: {},

      StopTransactionRequest: {
        transactionId: 6,
        idTag: 'TAG1',
        timestamp: "2018-03-02T15:09:18Z",
        meterStop: 40
      },

      StopTransactionResponse: {
        idTagInfo: {
          status: 'Expired',
          expiryDate: "2013-02-01T15:09:18Z",
          parentIdTag: 'PARENT'
        }
      },

      FirmwareStatusNotificationRequest: {
        status: 'DownloadFailed'
      },

      FirmwareStatusNotificationResponse: {},

      DiagnosticsStatusNotificationRequest: {
        status: 'Uploaded'
      },
      DiagnosticsStatusNotificationResponse: {},

      ChangeAvailabilityRequest: {
        connectorId: 1,
        type: 'Inoperative'
      },

      ChangeAvailabilityResponse: {
        status: 'Accepted'
      },

      ClearCacheRequest:{},
      ClearCacheResponse: {
        status: 'Accepted'
      },

      RemoteStartTransactionRequest: {
        idTag: '044943121F1D80',
        connectorId: 2
      },

      RemoteStartTransactionResponse: {
        status: 'Accepted'
      },

      RemoteStopTransactionRequest: {
        transactionId: 1
      },

      RemoteStopTransactionResponse: {
        status: 'Accepted'
      },

      ResetRequest: {
        type: 'Soft'
      },

      ResetResponse: {
        status: 'Accepted'
      },

      UnlockConnectorRequest: {
        connectorId: 1
      },

      UnlockConnectorResponse: {
        status: 'Unlocked'
      },

      UpdateFirmwareRequest: {
        retrieveDate: '2013-02-01T15:09:18Z',
        location: 'ftp://root:root@fork.gir.foo/tmp/kvcbx-updt.amx',
        retries: 4,
        retryInterval: 20
      },
      UpdateFirmwareResponse: {},

      ChangeConfigurationRequest: {
        key: 'KVCBX_LANG',
        value: 'FR'
      },

      ChangeConfigurationResponse: {
        status: 'Accepted'
      },
	  
	  TriggerMessageRequest: {
        requestedMessage: 'BootNotification'
      },

      TriggerMessageResponse: {
        status: 'Accepted'
      },
	  
	  GetCompositeScheduleRequest: {
        connectorId: 0,
		duration: 5
      },

      GetCompositeScheduleResponse: {
        status: 'Accepted',
		connectorId: 0,
		scheduleStart: "2018-04-01T15:09:18Z"/*,
		chargingSchedule: [
          {
            "duration": 86400,
			"chargingRateUnit": "W",
            "chargingSchedulePeriod": [{
						"startPeriod": 0,
						"limit": 11000,
						"numberPhases": 3
					}, {
						"startPeriod": 28800,
						"limit": 6000,
						"numberPhases": 3
					}, {
						"startPeriod": 72000,
						"limit": 11000,
						"numberPhases": 3
					}
				]
          }
        ]*/
      },
	  
	  ClearChargingProfileRequest: {
		  id: 1,
		  connectorId: 2,
		  chargingProfilePurpose: 'ChargePointMaxProfile',
		  stackLevel: 1
      },

      ClearChargingProfileResponse: {
        status: 'Accepted'
      },

      GetDiagnosticsRequest: {
        location: 'ftp://root:root@axis.gir.foo/tmp',
        startTime: "2013-02-01T15:09:18Z",
        stopTime: "2013-02-01T15:09:18Z",
        retries: 4,
        retryInterval: 20
      },

      GetDiagnosticsResponse: {
        fileName: 'diag-gir.vat.mx.000e48-20130131132608.txt'
      },

      DataTransferRequest: {
        vendorId: 'fr.tm.cnr',
        messageId: 'GetChargeInstruction',
        data: ''
      },

      DataTransferResponse: {
        status: 'Accepted',
        data: '{"transactionId":1,"maxPower":3,"expiration":'+
          '"2013-01-31T15:00:00Z","userWarning":false}'
      },

      GetLocalListVersionRequest: {},
      GetLocalListVersionResponse: {
        listVersion: 0
      },

      SendLocalListRequest: {
        updateType: "Full",
        listVersion: 1,
        localAuthorisationList: [
          {"idTag":"044943121F1D80",
          "idTagInfo":{
            "status":"Accepted","expiryDate":"2013-02-01T15:09:18Z",
            "parentIdTag":""}}],
        hash:""
      },

      SendLocalListResponse: {
        status: 'Accepted'
      },

      GetConfigurationRequest: {
        key: ['KVCBX_PROFILE']
      },

      GetConfigurationResponse: {
        configurationKey: [{"key":"KVCBX_PROFILE","readonly": true,
          "value":"NQC-ACDC"}],
        unknownKey: []
      },

      ReserveNowRequest: {
        connectorId: 0,
        expiryDate: "2013-02-01T15:09:18Z",
        idTag: "044943121F1D80",
        parentIdTag: "",
        reservationId: 0
      },

      ReserveNowResponse: {
        status: 'Accepted'
      },

      CancelReservationRequest: {
        reservationId: 0
      },

      CancelReservationResponse: {
        status: "Accepted"
      }

    }

  },


  /**
   *  WSDL Examples with the old `@ attributes format`
   */
  wsdl_attr_at: {

    MeterValuesRequest: {
      connectorId: 2,
      transactionId: 0,
      meterValue: [
        {
          "timestamp": "2013-02-01T15:09:18Z",
          "value": ["0", "0"],
          "@value": [{},{}]
        },
        {
          "timestamp": "2013-02-01T15:09:18Z",
          "value": ["20","20"],
          "@value": [{
            "unit": "Wh",
            "measurand": "Energy.Active.Import.Register"
          },{
            "unit": "Wh",
            "measurand": "Energy.Active.Import.Register"
          }]
        }
      ]
    },

    StopTransactionRequest: {
      transactionId: 0,
      idTag: 'B4F62CEF',
      timestamp: "2013-02-01T15:09:18Z",
      meterStop: 20,
      transactionData: [
        {"values":[
          {
            "timestamp": "2013-02-01T15:09:18Z",
            "value": ["0","0"],
            "@value": [{},{}]
          },{
            "timestamp": "2013-02-01T15:09:18Z",
            "value": ["20","20"],
            "@value": [{
              "unit": "Wh",
              "measurand": "Energy.Active.Import.Register"
            },{
              "unit": "Wh",
              "measurand": "Energy.Active.Import.Register"
            }]
          }]
        },{"values":[
          {
            "timestamp": "2013-02-01T15:09:18Z",
            "value": ["0","0"]
          },{
            "timestamp": "2013-02-01T15:09:18Z",
            "value": ["20","20"],
            "@value": [{
              "unit": "Wh",
              "measurand": "Energy.Active.Import.Register"
            },{
              "unit": "Wh",
              "measurand": "Energy.Active.Import.Register"
            }]
          }]
        }]
    }

  },

  /**
   *  Error message descriptions
   */

  ERRORS_DESC: {
    "NotImplemented": "Method name is not recognized.",
    "NotSupported":  "Method name is recognized but not supported by the "+
      "receiver.",
    "InternalError": "An internal error occurred and the receiver is not able"+
      "to complete the operation.",
    "ProtocolError": "Sender's message does not comply with protocol "+
      "specification.",
    "SecurityError": "Sender failed authentication or is not authorized to use"+
      " the requested operation.",
    "FormationViolation": "Sender's message is not well-formed.",
    "PropertyConstraintViolation": "A property name in sender's message is not "
      +"conform to the PDU structure.",
    "OccurenceConstraintViolation":  "Sender's message violates occurence "+
      "constraints.",
    "TypeConstraintViolation": "Sender's message violates data type "
      + "constraints.",
    "GenericError": "Other error."
  },

 
  /**
   *  Return default values from a procedure name and replace them by CLI
   *  arguments (argument=value) if they exist.
   *
   *  @param {String} procedure Name
   *  @param {Object} custom payload object
   */

  getRequestValues: function(procName, args) {
    if(typeof args == 'string')
      return args;

    var prot = OCPP.SUB_PROTOCOL instanceof Array ?
        prot = OCPP.SUB_PROTOCOL[OCPP.SUB_PROTOCOL.length - 1] :
        prot = OCPP.SUB_PROTOCOL;
      prot = Utils.retrieveVersion(prot);

    var values = OCPP.wsdl[prot][procName + 'Request'];

    // if no args specified, get the default values
    if(!Utils.isEmpty(args)) {
      for(var c in args) {
        // if doesnt exist
        if(values[c] == undefined) {
          console.log('Error: unknown field `'+ c +'\' for procedure `'+
            procName +'\'');
          return -1;
        }

        try {
          values[c] = JSON.parse(args[c]);
        } catch(e) {
          // if cant parse the argument, return an error
          console.log('Error: invalid value for argument `'+ c+'\': '+ args[c]);
          return -1;
        }
      }
    }

    return values;
  },


  /**
   *
   *
   */
  methodTree: {},

  /**
   *
   *
   */
  fillMethodTree: function(version, type, tree) {
    if(OCPP.methodTree[version] == undefined)
      OCPP.methodTree[version] = {};

    OCPP.methodTree[version][type] = tree;
  },



  /**
   *
   */

  checkBasicType: function(_type, value) {
    var error = false;

    switch(_type) {
    case 's:int':
      error = typeof value != 'number';
      break;
    case 's:string':
      error = typeof value != 'string';
      break;
    case 's:boolean':
      error = typeof value != 'boolean';
      break;
    case 's:dateTime':
      // TODO better check of date
      error = false; //typeof value != 'string' && typeof value != 'object';
      break
    case 's:anyURI':
      error = !Utils.validURL(value);
      break;
    default:
    }

    return error;
  },


  /**
   *
   *
   */

  checkPayload: function(values, types, infos, _this) {
    // check if exists and types
    for(var value in values) {
      if(!OCPP.WITH_ATTR_AT) {
        if(value == 'values')
          continue;
      }

      // if doesn't exist and not an attribute, error
      if(values != 'values' && types[value] == undefined && value[0] != '@') {
        _this._returnError(infos.from, infos.callId,
          "PropertyConstraintViolation");
        return true;
      }
      else {
        if(value[0] == '@')
          continue;

        var isArray = false;
        // check if array
        if(types[value].maxOccurs == 'unbounded') {
          isArray = true;

          if(!values[value] instanceof Array) {
            _this._returnError(infos.from, infos.callId,
              "TypeConstraintViolation");
            return true;
          }
        }

        // Specific case 'value' element from tns:MeterValue
        if(types[value]['name'] == 'value'
          && types[value]['type'] != 's:string') {
          var err = OCPP.checkValueField(infos, types, values, _this);

          if(err)
            return true;
        }
        else if(isArray) {
          for(var index in values[value]) {
            var err = OCPP.checkField(infos, types[value], values[value][index],
              _this);
            if(err)
              return true;
          }
        }
        else {
          var error = OCPP.checkField(infos, types[value], values[value],
            _this);

          if(error)
            return true;
        }

        delete types[value];
        delete values[value];
      }
    }

    // check mandatory options
    for(var p in types) {
      if(types[p]['minOccurs'] >= 1) {
        _this._returnError(infos.from, infos.callId,
          "OccurenceConstraintViolation");
        return true;
      }
    }

    return false;
  },


  /**
   *
   */

  typeError: function(infos, type, value, _this) {
    Utils.log('Error #'+ (infos.callId || '') +': expected type '
      + type +', got: '+ value);

    _this._returnError(infos.from, infos.callId, "TypeConstraintViolation");

    return true;
  },

  /**
   *
   */

  checkField: function(infos, params, args, _this) {


    var type_error = OCPP.checkBasicType(params.type, args);
    if(type_error) {
      _this._returnError(infos.from, infos.callId,
        "TypeConstraintViolation");
      return true;
    }

    var type = params['type'].split(':')[1];
    var simple = Utils.JSON.getPathFromType(
          Utils.JSON.simpleTypes[infos.version][infos.model], type),
        complex = Utils.JSON.getPathFromType(
          Utils.JSON.complexTypes[infos.version][infos.model], type);

    // if is simple type
    if(simple != null) {
      simple = simple['s:restriction'];

      var _type = simple[0]['$']['base'];

      // check basic type
      var err = OCPP.checkBasicType(_type, args);
      if(err === true) {
        return OCPP.typeError(infos, params['type'], args, _this);
      }

      // if maxLength
      if(simple[0]['s:maxLength'] != null) {
        if(args.length > simple[0]['s:maxLength'][0]['$']['value']) {
          // TODO Type violation or GenericError ?
          _this._returnError(infos.from, infos.callId,
            "TypeConstraintViolation");
          return true;
        }
      }

      // if enum
      if(simple[0]['s:enumeration'] != null) {
        var exists_in_enum = false;
        for(var r in simple[0]['s:enumeration']) {
          if(simple[0]['s:enumeration'][r]['$']['value'] == args) {
            exists_in_enum = true;
          }
        }

        // if not in enum
        if(!exists_in_enum) {
          // TODO Type violation or GenericError ?
          _this._returnError(infos.from, infos.callId,
            "TypeConstraintViolation");
          return true;
        }
      }
    }

    // if is complex
    if(complex != null) {

      // we treat the values like if it were always an array

      var values = [];

      // if array just copy
      if(args instanceof Array)
        values = args;
      // else, add it to the array
      else
        values.push(args);

      var elements = complex['s:sequence'][0]['s:element'],
          obj = {};

      for(var e in elements) {
        var name = elements[e]['$']['name'];
        obj[name] = elements[e]['$'];

       /* // specific case for 'value'
        if(name == 'value') {
          obj[name]['type'] = 'value';
        }*/
      }

      var payload_error = false, copy;
      for(var v in values) {
        // recursive call
        copy = Utils.clone(obj);
        if (OCPP.checkPayload(values[v], obj, infos, _this))
          payload_error = true;

        obj = copy;
      }

      return payload_error;
    }
  },

  /**
   *  Special Case: value field
   */

  checkValueField: function(infos, types, values, _this) {
    var seq = Utils.JSON.getSequenceOfType(Utils.JSON.complexTypes
      [infos.version]['cs'], 'MeterValue')
      || Utils.JSON.getSequenceOfType(Utils.JSON.complexTypes
        [infos.version]['cp'], 'MeterValue');
    var attr = seq[1]['s:complexType'][0]
      ['s:simpleContent'][0]['s:extension'][0]['s:attribute'];

    if(!(values['value'] instanceof Array)) {
      _this._returnError(infos.from, infos.callId,
        "TypeConstraintViolation");
      return true;
    }

    if(values['@value'] != undefined) {
      if(values['@value'].length != values['value'].length) {
        _this._returnError(infos.from, infos.callId,
          "OccurenceConstraintViolation");
        return true;
      }
    }

    var attrs = {};
    for (var t in attr) {
      attrs[attr[t]['$']['name']] = attr[t]['$'];
    }

    for(var index in values['@value']) {
      var attributes = values['@value'][index];
      for(var at in attributes) {
        if(at == '')
          continue;

        // if namespace, split
        if(at.indexOf(':') > 0) {
          var old = at;
          at = at.split(':')[1];
          attributes[at] = attributes[old];
        }

        if(at in attrs) {
          var _values = {};
          _values[at] = attributes[at];

          var _types = {};
          _types[at] = {};
          _types[at].name = at;
          _types[at].type = attrs[at]['type'];
          return OCPP.checkPayload(_values, _types, infos, _this);
        }
        else {
          _this._returnError(infos.from, infos.callId,
            "PropertyConstraintViolation");
          return true;
        }
      }
    }

    return false;
  },

  /**
   *
   */

  readFile: function(version, path) {
    var _version = version;
    var data;

    try {
      data = fs.readFileSync(path, 'utf8'); 
    }
    catch(e) {
      console.log('Warning: WSDL file not found for `'+
        version.replace('_', ' ') +'\'. Simulator wont\'t be able to deal'+
        ' with payload errors for this version.');
      return;
    }

    parser.parseString(data, function (err, result) {
      var _methodTree = {},
          tokens = _version.split('_'),
          type = tokens[0],
          vers = tokens[1];

      var types = result['wsdl:definitions']['wsdl:types'][0]
        ['s:schema'][0];

      if(Utils.JSON.complexTypes[vers] == undefined)
        Utils.JSON.complexTypes[vers] = {};

      if(Utils.JSON.simpleTypes[vers] == undefined)
        Utils.JSON.simpleTypes[vers] = {};

      Utils.JSON.complexTypes[vers][type] = types['s:complexType'];
      Utils.JSON.simpleTypes[vers][type] = types['s:simpleType'];

      // fetch all the messages
      var msg = result['wsdl:definitions']['wsdl:message'];
      for(var m in msg) {
        var message = msg[m]['wsdl:part'][0]['$'].element;
        // only push request and response
        if(message.indexOf('Request') > 0 || message.indexOf('Response')
          > 0) {
          var message = Utils.deleteNamespace(message),
              name = message.toLowerCase()
                .replace('request', '').replace('response', ''),
              message = Utils.capitaliseFirstLetter(message);

          if(_methodTree[name] == undefined)
            _methodTree[name] = {};

          _methodTree[name][message] = {};
        }
      }

      // for all the messages
      for(var i in _methodTree) {
        for(var method in _methodTree[i]) {
          var params = Utils.JSON.getSequenceOfType(
            Utils.JSON.complexTypes[vers][type], method),
            args = {};

          // fill the object with values according to the type
          for (var p in params) {
            var name = params[p]['name'];
            args[name] = params[p];
          }

          _methodTree[i][method] = args;

        }
      }

      OCPP.fillMethodTree(vers, type, _methodTree);
    });
  },



  /**
   *
   */

  readWSDLFiles: function() {
    // parse WSDL and retrieve messages
    for(var w in OCPP.WSDL_FILES) {
      OCPP.readFile(w, __dirname + '/../' + OCPP.WSDL_FILES[w]);
    }
  },

  /**
   *
   */

  enableAttributesWithAt: function() {
    OCPP.WITH_ATTR_AT = true;
    OCPP.wsdl['1.6']['MeterValuesRequest']
      = OCPP.wsdl_attr_at['MeterValuesRequest'];
    OCPP.wsdl['1.6']['StopTransactionRequest'] 
      = OCPP.wsdl_attr_at['StopTransactionRequest'];

  },

  /**
   *
   */

  JSONSchemas: {},
  
  /**
   *
   */

  buildJSONSchemas: function() {
    for(var v in OCPP.VERSIONS) {
      var version = OCPP.VERSIONS[v];
      OCPP.JSONSchemas[version] = {};

      if(!Utils.JSON.simpleTypes[version])
          continue;

      for(var s in OCPP.SYSTEMS) {
        var system = OCPP.SYSTEMS[s];
        OCPP.JSONSchemas[version][system] = {};

        var schemaTree = {};
        for(var method in OCPP.methodTree[version][system]) {
          for(var methodName in OCPP.methodTree[version][system][method]) {
            var topSchema = {};
            topSchema = OCPP.getJSONSchema(methodName, version, system);
            topSchema['$schema'] = 'http://json-schema.org/draft-04/schema#';
            topSchema['title'] = methodName;

            // property reordering
            var props = ['type', 'properties', 'required'];
            for(var p in props) {
              var pr = props[p];
              if(topSchema[pr]) {
                var items = Utils.clone(topSchema[pr]);
                delete topSchema[pr];
                topSchema[pr] = items;
              }
            }

            OCPP.JSONSchemas[version][system][methodName] = topSchema;
          }
        }
      }
    }
  },
  
  /**
   *
   */

  getJSONSchema: function(type, version, system) {
    if(type == undefined)
      return {};

    if(type.substring(0, 4) == 'tns:')
      type = Utils.deleteNamespace(type);

    var simpleType = Utils.JSON.getPathFromType(
      Utils.JSON.simpleTypes[version][system], type);
    var complexType = Utils.JSON.getPathFromType(
      Utils.JSON.complexTypes[version][system], type);

    // primitive type
    if(type.substring(0, 2) == 's:') {
      type = Utils.deleteNamespace(type);
      var prop = { type: null };

      if(type == 'int')
        prop.type = 'number';
      else if(type == 'string')
        prop.type = 'string'
      else if(type == 'dateTime') {
        prop.type = 'string';
        prop['format'] = 'date-time';
      }
      else if(type == 'anyURI') {
        prop.type = 'string';
        prop['format'] = 'uri';
      }
      else if(type == 'boolean')
        prop.type = 'boolean';

      return prop;
    }

    // simple type
    else if(simpleType) {
      var prop = {
        type: Utils.deleteNamespace(
          simpleType['s:restriction'][0]['$']['base'])
      };

      if(simpleType['s:restriction']) {
        if(simpleType['s:restriction'][0]) {
          // enum
          if(simpleType['s:restriction'][0]['s:enumeration']) {
            var values = [];
            for(var i in simpleType['s:restriction'][0]['s:enumeration']) {
              values.push(
                simpleType['s:restriction'][0]
                ['s:enumeration'][i]['$']['value']);
            }
            
            prop['enum'] = values;
          }

          // maxLength
          if(simpleType['s:restriction'][0]['s:maxLength']) {
            prop['maxLength'] = parseInt(simpleType['s:restriction'][0]
              ['s:maxLength'][0]['$']['value'], 10);
          }
        }
      }

      return prop;
    }

    // complex type
    else if(complexType) {
      if(complexType['s:sequence'] == null)
        return {
          type: 'object',
          properties: {}
        };

      var sequence = complexType['s:sequence'][0]['s:element'];
      var root = {
        type: 'object',
        properties: {},
        required: []
      };
      var props = root.properties;

      for(var e in sequence) {
        var element = sequence[e]['$'];

        props[element.name] = {};
        props[element.name] = OCPP.getJSONSchema(element.type, version, system);

        if(element.minOccurs == 1)
          root.required.push(element.name);

        if(element.maxOccurs == 'unbounded') {
          var items = Utils.clone(props[element.name]);
          props[element.name].type = 'array';
          props[element.name].items = items;
          props[element.name].items.required
            = Utils.clone(props[element.name].required);
          
          delete props[element.name].required;
          delete props[element.name].properties;

          var minOccurs = parseInt(element.minOccurs);
          if(minOccurs > 0)
            props[element.name].minItems = minOccurs;
        }
      }

      if(root.required.length == 0)
        delete root.required;

      return root;
    }
  },

  /**
   *  special case: items for `value` type
   */

  itemsForValueType: {
    type: 'object',
    properties: {
      timestamp: {
        type: 'string',
        format: 'date-time'
      },
      values: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: {
              type: 'string'
            },
            context: {
              type: 'string'
            },
            format: {
              type: 'string'
            },
            measurand: {
              type: 'string'
            },
            location: {
              type: 'string'
            },
            unit: {
              type: 'string'
            }
          },
          required: ['value']
        },
        minItems: 1
      }
    },
    required: ['values']
  },

  /**
   *
   */

  propertiesExist: function(values, schema) {
    var exist = true;

    for(var v in values) {
      if(!schema[v]) {
        exist = false;
      }
      else if(schema[v].type == "array" && schema[v].items.type == "object") {
        for(var i in values[v]) {
          if(!OCPP.propertiesExist(values[v][i], schema[v].items.properties))
            exist = false;
        }
      }
      else if(schema[v].type == "object") {
        if(!OCPP.propertiesExist(values[v], schema[v].properties))
          exist = false;
      }
    }

    return exist;
  },

  /**
   *
   *
   */
  managePayloadErrors: function(values, infos, _this) {
    var version = infos.version,
        model = infos.model,
        suffix = infos.suffix,
        methodName = infos.procName + suffix,
        schema = JSON.parse(JSON.stringify(
          OCPP.JSONSchemas[version][model][methodName]));

    var report = js.validate(values, schema);
    if(report.length > 0) {
      // only treat the first error
      var firstError = report[0];

      switch(firstError.constraintName) {
      case "enum":
      case "maxLength":
      case "type":
        _this._returnError(infos.from, infos.callId, "TypeConstraintViolation");
        return false;
        break;
      case "minItems":
      case "required":
        _this._returnError(infos.from, infos.callId,
          "OccurenceConstraintViolation");
        return false;
        break;
      }
    }

    if(!OCPP.propertiesExist(values, schema["properties"])) {
      _this._returnError(infos.from, infos.callId,
          "PropertyConstraintViolation");
      return false;
    }

    return true;
  }

};

/** Result Function
 *  Prototype for making
 *
 *  @param {Object} Object of function, onSuccess is mandatory
 */
function ResultFunction(hands) {
  this.handlers = {
    onSuccess: hands.onSuccess,

    /** Default error handler
     */
    onError: hands.onError || function(callId, err) {
      Utils.log("Error for the message #"+ callId +" : "+ err);
    }
  };
};

module.exports = OCPP;
