/**
 *  Hello world plugins
 *
 */


var plugin = {

  name: 'Hello world!',
  description: 'Hello World plugin example',
  author: '',

  ocpp_version: '1.6',
  system: 'cp',

  onLoad: function() {
    this.log('Hi, I\'m the '+ plugin.name +' plugin !');
  },

  onUnload: function() {
    this.log('Goodbye !');
  }

};

module.exports = plugin;

