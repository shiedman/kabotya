
function LocalProxy(remoteProxy) {
  this.remoteProxy  = remoteProxy;
  this.serverSocket = null;
  this.proxyInfo    = null;
  this.googleHost=prefs.getCharPref('googleHost');//prefs refrenced in Services.js
  var server=remoteProxy.getHost();
  if(server.indexOf('.dotcloud.')>0){
      this.remoteProxy.type='dotcloud';
  }else if (server.indexOf('.appspot.com')>0){
      this.remoteProxy.type='appspot';
  }
  this.transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
  this.constructServerSocket();
  this.initializeProxyInfo();
}

LocalProxy.prototype.shutdown = function() {
    //for(var i=shufflers.length-1;i>=0;i--){
        //shufflers[i].closeAll();
        //shufflers.splice(i,1);
    //}
  this.serverSocket.close();
  this.serverSocket=null;
  this.transportService = null;
};

LocalProxy.prototype.getProxyInfo = function() {
  return this.proxyInfo;
};


LocalProxy.prototype.constructServerSocket = function() {
  this.serverSocket = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);
  
  this.serverSocket.init(-1,true,-1);
  this.serverSocket.asyncListen(this);
};

LocalProxy.prototype.initializeProxyInfo = function() {
  var proxyService = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService(Components.interfaces.nsIProtocolProxyService);
  this.proxyInfo   = proxyService.newProxyInfo("http", "localhost", this.serverSocket.port,
					       0, 0, null);

};

LocalProxy.prototype.connectToRemoteProxy = function() {
  var host=this.remoteProxy;
  if(host.type=='appspot'){
      return this.transportService.createTransport(['ssl'],1,this.googleHost,443,null);    
  }else if(host.type=='dotcloud'){
      return this.transportService.createTransport(null,0,host.getHost(), host.getPort(),null);    
  }else{
      return null;
  }
};

LocalProxy.prototype.onSocketAccepted = function(serverSocket, clientTransport) {
  var serverTransport = this.connectToRemoteProxy();
  var dataShuffler    = new DataShuffler(clientTransport, serverTransport,this.remoteProxy.getHost());
  dataShuffler.shuffle();
};

LocalProxy.prototype.onStopListening = function(serverSocket, status) {
  // dead
};

LocalProxy.prototype.toString = function() {
    var info=this.proxyInfo;
  return 'proxy:'+info.type+' ' +info.host+':'+info.port+'\r\n\r\tconnect to:'+this.remoteProxy;
};
