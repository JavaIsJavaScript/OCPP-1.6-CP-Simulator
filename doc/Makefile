CC = node
PRG = gir-ocppjs-doc.js

all: ocpp_1.2 ocpp_1.6

ocpp_1.2:
	cat tpl/header.html > ocpp_1.2.html;
	echo "<h1>Experimental OCPP 1.2 over Websocket</h1>" >> ocpp_1.2.html;
	cat tpl/types.html >> ocpp_1.2.html;
	echo "<h2>Central System service</h2>" >> ocpp_1.2.html;
	node ${PRG} wsdl/ocpp_centralsystemservice_1.2_final.wsdl >> ocpp_1.2.html;
	echo "<h2>Charge Point service</h2>" >> ocpp_1.2.html;
	node ${PRG} wsdl/ocpp_chargepointservice_1.2_final.wsdl >> ocpp_1.2.html;
	cat tpl/footer.html >> ocpp_1.2.html;

ocpp_1.6:
	cat tpl/header.html > ocpp_1.6.html;
	echo "<h1>Experimental OCPP 1.6 over Websocket</h1>" >> ocpp_1.6.html;
	cat tpl/types.html >> ocpp_1.6.html;
	echo "<h2>Central System service</h2>" >> ocpp_1.6.html;
	node ${PRG} wsdl/ocpp_centralsystemservice_1.6_final.wsdl >> ocpp_1.6.html;
	echo "<h2>Charge Point service</h2>" >> ocpp_1.6.html;
	node ${PRG} wsdl/ocpp_chargepointservice_1.6_final.wsdl >> ocpp_1.6.html;
	cat tpl/footer.html >> ocpp_1.6.html;

clean:
	rm ocpp_1.2.html; rm ocpp_1.6.html;
