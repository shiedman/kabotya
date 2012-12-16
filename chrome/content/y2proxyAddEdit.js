"use strict";
const Cu=Components.utils;
Cu.import("resource://kabotya/Services.js");
//const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
//Cu.import("resource://kabotya/common.js");
var y2proxyOptAdd={};
(function(){
function onDialogLoad() {
  var retVal = window.arguments[0];

  if (retVal.proxy) {
    var proxy = retVal.proxy;

    document.getElementById("proxy-name").value      = proxy.getName();
    document.getElementById("proxy-host").value      = proxy.getHost();
    document.getElementById("proxy-port").value      = proxy.getPort();

  }
}

function onDialogOK() {  
  var name    = document.getElementById("proxy-name").value;
  var host    = document.getElementById("proxy-host").value;
  var port    = document.getElementById("proxy-port").value;

  if (!host || !name || !port) {
    alert("Sorry, you  must specify a name, host, and port.");
    return false;
  }


  var retVal = window.arguments[0];
  var proxy;

  if (retVal.proxy) {
    proxy = retVal.proxy;
  } else {
    proxy = new kabotyaExt.Proxy();
  }

  proxy.setName(name);
  proxy.setHost(host);
  proxy.setPort(port);

  retVal.proxy = proxy;

  return true;
}
y2proxyOptAdd.onDialogLoad=onDialogLoad;
y2proxyOptAdd.onDialogOK=onDialogOK;
})();
