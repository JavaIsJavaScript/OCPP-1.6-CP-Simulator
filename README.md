# OCPP 1.6 Charge Point Simulator
Hacky but it works for testing purposes

ChargePoint > CentralSystem all working and can be called on the commandline using "bootnotification, metervalues" etc.

CentralSystem > ChargePoint :
+ All 1.5 features 
+ All 1.6 features

This program requires Node.js (http://nodejs.org/). Third-party packages can be installed with the npm utility. Currently, ocppjs depends on 'websocket', 'xml2js', 'node-expat', 'request' and 'jayschema' packages:

### Running the Simulator

Just run "run.bat"

See: [1.5-Simulator Branch](https://github.com/JavaIsJavaScript/ocpp1.6-CP-Simulator/tree/1.5-Simulator) for 1.5 Simulator, works the same as this one.

### Bugs
+ None known currently
  
  [CREDITS](http://www.gir.fr/ocppjs/)
