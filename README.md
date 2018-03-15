
# ocppjs - An experimental OCPP Simulator


## Overview

Open Charge Point Protocol (OCPP, <http://ocppforum.net>) is a communication
protocol between multiple charging stations ("charge points") and a single
management software ("central system").

Currently (december 2012), two OCPP versions (1.2 and 1.5) have been released.
There is a draft in progress for a new version (2.0).
Both existing versions use SOAP over HTTP as the RPC/transport protocol:

    +---------------+ soap/http client      soap/http server +---------------+
    |               |--------------------------------------->|               |
    |               |  Operations initiated by ChargePoint   |               |
    |  ChargePoint  |                                        | CentralSystem |
    |               | soap/http server      soap/http client |               |
    |               |<---------------------------------------|               |
    +---------------+  Operations initiated by CentralSystem +---------------+

The two main problems with this solution are:

- It requires the CentralSystem to be able to establish a TCP/IP connection
  to the ChargePoint. This is often not possible on IP based mobile data
  networks using a public APN, where the ChargePoint is assigned a private IP
  address on the operator network. In such cases, the ChargePoint can access
  the Internet (using NAT), but no connection can be made from the Internet to
  the ChargePoint. A possible solution is to set up a VPN and/or a private APN,
  but the cost is generally prohibitive for small installations.
- SOAP is very verbose, with a large overhead on every message. This causes
  a non-optimal bandwidth consumption, which can raise the running cost of
  an installation.

This project proposes a new RPC/transport for OCPP, that addresses
these two issues, using Websocket (<http://tools.ietf.org/html/rfc6455>) for the
transport layer, and SPRC (see Protocol Specification section below) for the
RPC layer.


## Architecture

This schema shows objects instances for a system with
one ChargePointSimulator and one CentralSystemSimulator.

    +------------------------+             +------------------------+
    |  ChargePointSimulator  |             | CentralSystemSimulator |
    +------------------------+             +------------------------+
      |create (param: url)                   |create (param: listening tcp port)
      V                                      V
    +------------------------+   connect   +------------------------+
    |     WebSocketClient    |------------>|     WebSocketServer    |
    +------------------------+             +------------------------+

When a WebSocket connection (i.e. a transport layer) is established,
each peer creates:

- a WampClientConnection, to make RPC calls
- a WampServerConnection, to handle RPC calls

This gives two independant RPC channels on a single TCP connection:

      +------------------------+             +------------------------+
    +-|  ChargePointSimulator  |             | CentralSystemSimulator |-+
    | +------------------------+             +------------------------+ |
    | create (param: connection)              create (param: connection)|
    |                                                                   |
    | +------------------------+             +------------------------+ |
    +>|  WampClientConnection  |------------>|  WampServerConnection  |<+
    | +------------------------+  RPC call   +------------------------+ |
    |                           (e.g. MeterValue)                       |
    |                                                                   |
    | +------------------------+             +------------------------+ |
    +>|  WampServerConnection  |<------------|  WampClientConnection  |<+
      +------------------------+  RPC call   +------------------------+
                                (e.g. Reset)

## Installation & usage

This program requires Node.js (<http://nodejs.org/>).
Third-party packages can be installed with the npm utility.
Currently, ocppjs depends on 'websocket', 'xml2js', 'node-expat',
'request' and 'jayschema' packages:

    % npm install

To run the OCPP.js simulator, just enter

    % node gir-ocppjs.js

You will be given a prompt where you can enter commands.

Commands syntax:

- `start_cs <port> [options]`: Start a CentralSystem
  simulator, listening on the specified TCP `<port>`.
  This command can be directly specified on the command line.
  Options:
  `-i <pingInterval>`: websocket ping interval (default: 300s)
  `-u <endpoint>`: endpoint URL (default: '/')
  `-p <protocol>`: websocket protocol name (default: 'ocpp1.2,ocpp1.5')
- `start_cp <url> <id>`: Start a ChargePoint simulator, which will try to
  connect to a CentralSystem on the specified URL, using the specified
  chargepoint `<id>`.
  This command can be directly specified on the command line.
  Options:
  `-p <protocol>`: websocket protocol name (default: 'ocpp1.5')
  `-i <pingInterval>`: websocket ping interval (default: 300s)
  `-t <transport>`: transport layer mode (websocket or soap), default: websocket
  `-f <from>`: in SOAP mode, defines the SOAP From header.
  `-r <remoteActionPort>`: in SOAP mode, defines the remote action port.
- `remote_<cmd> [options] [custom_arguments]`: When a CentralSystem simulator is
  running and has a connected chargepoint, perform a `<cmd>`
  remote action.
  See `help` for available commands.
  Options:
  `--remote-id <id>`: send the remote action to the specified
  chargepoint `<id>`. This parameter can be omitted when a single chargepoint
  is connected.
  Custom Arguments: see section `Argument customization` below. 
- `<cmd> [options] [custom_arguments]`: When a ChargePoint simulator `<id>` is
  running and is connected to a CentralSystem, send a `<cmd>` message.
  See `help` for available commands.
  Options:
  `--id id`: send the message using the specified chargepoint `<id>`.
  This parameter can be omitted when a single chargepoint simulator is running.
  Custom Arguments: see section `Argument customization` below.
- `set <cs|cp> [arguments]`: modify the simulator settings from command line
  interface.
  Arguments: setting=value ... Supported settings: `websocket_ping_interval`.

    > set cs websocket_ping_interval=120

- `help`: List available commands.
- `quit`: Exit the program.


Argument customization:

When typing `remote_<cmd>` or `<cmd>`, the fields of the payload can be
customized individually from the command line interface using the following
syntax:

    argument=value ...

    > bootnotification chargePointVendor="DBT"
    > bootnotification chargePointVendor="DBT" chargePointModel="NQC-ACDC"

`value` handles `string`, `number`, `object` and `array` types.


### Example - Running a CentralSytem

    % node gir-ocppjs.js start_cs 9000
    [2012-12-28 14:54:32] CentralSystem started.
    [2012-12-28 14:54:32] cs: Server is listening on port 9000
    [2012-12-28 14:54:44] cs: ChargePoint #0 connected from 127.0.0.1.

    >
    [2012-12-28 14:54:54] cs: <<cp#0 [2,"V7NeDL1MnbkaQcaHcYnvxOpCdcI4gpAV",
                          "BootNotification",{"chargePointVendor":"DBT",
                          "chargePointModel":"NQC-ACDC",...}]
    [2012-12-28 14:54:54] cs: >>cp#0 [3,"V7NeDL1MnbkaQcaHcYnvxOpCdcI4gpAV",
                          {"status":"Accepted",
                          "currentTime":"2012-11-28T13:54:44Z",
                          "heartbeatInterval":300}]

    > remote_reset type="Soft"
    [2012-12-28 14:56:50] cs: >>cp#0 [2,"tU8hVs8yY6Aleie1kN8fXD7YUJ0PDuyc",
                          "Reset",{"type":"Soft"}]
    [2012-12-28 14:56:50] cs: <<cp#0 [3,"tU8hVs8yY6Aleie1kN8fXD7YUJ0PDuyc",
                          {"status":"Accepted"}]

    >
    [2012-12-28 14:58:22] cs: <<cp#0 [2,"Shfrho1gR2NmsjCVeHpCOjImdNxhPPXq",
                          "MeterValues",{"connectorId":1,values:[{
                          "timestamp":"2012-12-28T13:58:22Z","value":0}]}]
    [2012-12-28 14:58:22] cs: >>cp#0 [3,"Shfrho1gR2NmsjCVeHpCOjImdNxhPPXq",
                          {}]

    >
    [2012-12-28 14:59:44] cs: <<cp#0 [2,"yUtxCAuRRv26dKRuQ1fy1AYvE0fZTZ2Z",
                          "Heartbeat",{}]
    [2012-12-28 14:59:44] cs: >>cp#0 [3,"yUtxCAuRRv26dKRuQ1fy1AYvE0fZTZ2Z",
                          {"currentTime":"2012-12-28T13:59:44Z"}]

### Example - Running a ChargePoint

    % node gir-ocppjs.js start_cp ws://localhost:9000 0
    [2012-12-28 14:54:44] ChargePoint #0 started.
    [2012-12-28 14:54:44] cp#0: Connected to CentralSystem.

    > bootnotification chargePointVendor="DBT" chargePointModel="NQC-ACDC"
    [2012-12-28 14:54:54] cp#0: >>cs [2,"V7NeDL1MnbkaQcaHcYnvxOpCdcI4gpAV",
                          "BootNotification",{"chargePointVendor":"DBT",
                          "chargePointModel":"NQC-ACDC",...}]
    [2012-12-28 14:54:54] cp#0: <<cs [3,"V7NeDL1MnbkaQcaHcYnvxOpCdcI4gpAV",
                          {"status":"Accepted",
                          "currentTime":"2012-12-28T13:54:44Z",
                          "heartbeatInterval":300}]

    >
    [2012-12-28 14:56:50] cp#0: <<cs [2,"tU8hVs8yY6Aleie1kN8fXD7YUJ0PDuyc",
                          "Reset",{"type":"Soft"}]
    [2012-12-28 14:56:50] cp#0: >>cs [3,"tU8hVs8yY6Aleie1kN8fXD7YUJ0PDuyc",
                          {"status":"Accepted"}]

    > metervalues
    [2012-12-28 14:58:22] cp#0: >>cs [2,"Shfrho1gR2NmsjCVeHpCOjImdNxhPPXq",
                          "MeterValues", {"connectorId":2,
                          values:[{"timestamp":"2012-12-28T13:58:22Z",
                          "value":0}]}]
    [2012-12-28 14:58:22] cp#0: <<cs [3,"Shfrho1gR2NmsjCVeHpCOjImdNxhPPXq",
                          {}]

    > heartbeat
    [2012-12-28 14:59:44] cp#0: >>cs [2,"yUtxCAuRRv26dKRuQ1fy1AYvE0fZTZ2Z",
                          "Heartbeat",{}]
    [2012-12-28 14:59:44] cp#0: <<cs [3,"yUtxCAuRRv26dKRuQ1fy1AYvE0fZTZ2Z",
                          {"currentTime":"2012-12-28T13:59:44Z"}]

### Example - Running a CentralSystem in SOAP mode

    % node gir-ocppjs.js start_cs 9000 -t soap
    [2013-04-22 16:44:44] cs: SOAP Server listening on port 9000
    [2013-04-22 16:44:44] CentralSystem started.

    [2013-04-22 16:57:52] cs: ChargePoint #boxid connected.
    [2013-04-22 16:57:52] cs: <<cp#boxid /BootNotification {"chargePointVendor":
                          "DBT","chargePointModel":"NQC-ACDC", ...}
    [2013-04-22 16:57:52] cs: >>cp#boxid /BootNotification {"status":"Accepted",
                          "currentTime":"2013-02-01T15:09:18.000Z",
                          "heartbeatInterval":1200}

    > remote_starttransaction
    [2013-04-22 17:01:48] cs: >>cp#boxid /RemoteStartTransaction {"idTag":
                          "044943121F1D80","connectorId":2}
    [2013-04-22 17:01:48] cs: <<cp#boxid /RemoteStartTransaction {"status":
                          "Accepted"}

### Example - Running a ChargePoint in SOAP mode

    % node gir-ocppjs.js start_cp http://localhost:9000 boxid -t soap \
        -f http://localhost:9001
    [2013-04-09 14:27:14] cs: SOAP Server listening on port 9001

    > bootnotification
    [2013-04-09 14:57:29] cp#boxid: >>cs /BootNotification {"chargePointVendor":
                          "DBT", "chargePointModel":"NQC-ACDC", ...}
    [2013-04-09 14:57:29] cs: >>boxid /BootNotification {"status":"Accepted",
                          "currentTime":"2013-02-01T15:09:18.000Z",
                          "heartbeatInterval":1200}
    ...

    [2013-04-22 17:01:48] cs: <<cp#boxid /RemoteStartTransaction {"idTag":
                          "044943121F1D80","connectorId":2}
    [2013-04-22 17:01:48] cs: >>cp#boxid /RemoteStartTransaction {"status":
                          "Accepted"}

    > set cp print_xml=true

    > heartbeat
    [2013-04-09 15:03:02] cp#boxid: >>cs <soap:Envelope ...>
                          <soap:Header>...</soap:Header><soap:Body>
                          <tns:heartbeatRequest></tns:heartbeatRequest>
                          </soap:Body></soap:Envelope>
    [2013-04-09 15:03:02] cs: >>boxid <?xml version="1.0" encoding="utf-8"?>
                          <soap:Envelope ...><soap:Body><tns:HeartbeatResponse>
                          <currentTime>2013-02-01T15:09:18Z</currentTime>
                          </tns:HeartbeatResponse></soap:Body></soap:Envelope>

## Unit testing

ocppjs provides a framework and four example files (in the test/ folder) for 
writing unit tests. If a test fails, the errors are printed on the standard 
output. If it succeeds then nothing is displayed.

### Example - Running a test

    % cd test/
    % node test-cp-1.2.js
    %

## Plugins

ocppjs provides a plugin system which allows developers to define the simulator
behavior without modifying the program source code. Plugins consist of extern
JavaScript files listed in the *plugins/* folder.

From the prompt of the simulator, 3 commands are available:

## Documentation

The gir-ocppjs-doc.js program generates JSON examples from WSDL files.
Run it with:

    % npm install xml2js
    % cd doc
    % make

Output files generated:

* <http://www.gir.fr/ocppjs/ocpp_1.2.shtml>
* <http://www.gir.fr/ocppjs/ocpp_1.5.shtml>

### Protocol specification

A draft specification for a WebSocket-based OCPP transport is available:
<http://www.gir.fr/ocppjs/ocpp_srpc_spec.shtml>

## Download

<http://www.gir.fr/ocppjs/gir-ocppjs-1.0.2.zip>
