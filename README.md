# ocpp1.6-CP-Simulator
Hacky but it works for testing purposes

This program requires Node.js (http://nodejs.org/). Third-party packages can be installed with the npm utility. Currently, ocppjs depends on 'websocket', 'xml2js', 'node-expat', 'request' and 'jayschema' packages:
+ npm install  

How to run:  
+ node gir-ocppjs.js  

Or just run this for simulating a ChargePoint  
+ node gir-ocppjs.js start_cp ws://127.0.0.1:8080/steve/websocket/CentralSystemService REE002

Where REE002 will be the name of the Charge Point and ws://127.0.0.1:8080/steve/websocket/CentralSystemService the endpoint of the CentralSystem using WebSocket/JSON, ofcourse these both can be changed.

See: [1.5Sim Branch](https://github.com/JavaIsJavaScript/ocpp1.6-CP-Simulator/tree/1.5Sim) for 1.5 CP Simulator, works the same as this one.

[CREDITS](http://www.gir.fr/ocppjs/)
