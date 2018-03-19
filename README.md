# OCPP 1.6 Laadpuntsimulator
Hacky maar het werkt voor testdoeleinden

ChargePoint> CentralSystem werkt en kan worden aangeroepen via de commandoregel met behulp van "bootnotification, metervalues" enz.

CentralSystem> ChargePoint alle 1.5 functies werken (controleer de glitches hieronder), de nieuwe functies van 1.6 zullen een NotImplemented retourneren.

Dit programma vereist Node.js (http://nodejs.org/). Pakketten van derden kunnen worden geïnstalleerd met het hulpprogramma npm. Momenteel is ocppjs afhankelijk van pakketten 'websocket', 'xml2js', 'node-expat', 'request' en 'jayschema':

### Vergeet dit niet te doen !!!!!!
+ npm installatie

Misschien geeft het wat fouten in de console, maar dat werkt prima.

### De simulator uitvoeren
+ knoop gir-ocppjs.js

Of voer dit gewoon uit om een ​​ChargePoint te simuleren
+ node gir-ocppjs.js start_cp ws: //127.0.0.1: 8080 / steve / websocket / CentralSystemService REE002

Waar REE002 de naam is van het Charge Point en ws: //127.0.0.1: 8080 / steve / websocket / CentralSystemService het eindpunt van het CentralSystem met behulp van WebSocket / JSON, natuurlijk kunnen deze beide worden gewijzigd.

Zie: [1.5-Simulator Branch] (https://github.com/JavaIsJavaScript/ocpp1.6-CP-Simulator/tree/1.5-Simulator) voor 1.5 Simulator, werkt hetzelfde als deze.

### Fouten
+ Bellen UnlockConnector.req vanuit het centrale systeem
+ SendLocalList.req vanuit het centrale systeem oproepen

Beide functies verbinden het gesimuleerde laadpunt opnieuw, maar de console laat zien dat het nog steeds het verzoek ontvangt en accepteert het, dit is slechts een glitch aangezien deze 1.6 Simulator hacker is.


[CREDITS] (http://www.gir.fr/ocppjs/)
