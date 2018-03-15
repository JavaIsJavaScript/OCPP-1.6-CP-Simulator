# ocpp1.6-CP-Simulator
Hacky but it works for testing purposes

How to run:
node gir-ocppjs.js start_cp ws://127.0.0.1:8080/steve/websocket/CentralSystemService REE002

Where REE002 will be the name of the Charge Point and ws://127.0.0.1:8080/steve/websocket/CentralSystemService the endpoint of the CentralSystem using WebSocket/JSON

See: https://github.com/JavaIsJavaScript/ocpp1.6-CP-Simulator/tree/1.5Sim for 1.5 CP Simulator, works the same as this one.

CREDITS: http://www.gir.fr/ocppjs/
