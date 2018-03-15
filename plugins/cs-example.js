/**
 *  Hello world plugins
 *
 */


var plugin = {

  name: 'Central System Plugin',
  description: 'Central System plugin example',
  author: '',

  ocpp_version: '1.5',
  system: 'cs',

  onLoad: function() {
    var self = this;

    self.onClientConnectionEvent(function(type, cbId) {
      switch(type) {
      case 'connected':
        self.log('[CS-Example] Hi '+ cbId +' !');
        self.cs.call('GetLocalListVersion');
        break;
      case 'disconnected':
        self.log('[CS-Example] Goodbye '+ cbId +' !');
        break;
      }
    });

    self.log('[CS-Example] Started.');
  },

};

module.exports = plugin;

