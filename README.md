# OCPP 1.6 Charge Point Simulator
Hacky but it works for testing purposes

ChargePoint > CentralSystem all working and can be called on the commandline using "bootnotification, metervalues" etc.

CentralSystem > ChargePoint :
+ All 1.5 features 
+ All 1.6 features ([See Bugs](#Bugs))

This program requires Node.js (http://nodejs.org/). Third-party packages can be installed with the npm utility. Currently, ocppjs depends on 'websocket', 'xml2js', 'node-expat', 'request' and 'jayschema' packages:

### Don't forget to do this!!!!!!
+ npm install  

Might give some errors in the console, but that's ok it still works.

### Running the Simulator
+ node gir-ocppjs.js  

Or just run this for simulating a ChargePoint  
+ node gir-ocppjs.js start_cp ws://127.0.0.1:8080/steve/websocket/CentralSystemService REE002

Where REE002 will be the name of the Charge Point and ws://127.0.0.1:8080/steve/websocket/CentralSystemService the endpoint of the CentralSystem using WebSocket/JSON, ofcourse these both can be changed.

See: [1.5-Simulator Branch](https://github.com/JavaIsJavaScript/ocpp1.6-CP-Simulator/tree/1.5-Simulator) for 1.5 Simulator, works the same as this one.

### #Bugs
+ SetChargingProfile can't handle ChargingSchedulePeriod with fractions in "limit" parameter

[CREDITS](http://www.gir.fr/ocppjs/)
