
function LocalProxy(remoteProxy) {
  //this.appid='pprroxxyy';//for test
  this.appid=null;
  if(remoteProxy){
      var server=remoteProxy.getHost();
      var i=server.indexOf('.appspot.com');
      if (i>0){
          this.appid=server.substring(0,i);
      }else if(server.indexOf('.dotcloud')>0){
          this.remoteProxy=remoteProxy;
      }
  }

  this.serverSocket = null;
  this.proxyInfo    = null;
  var googleHost=prefs.getCharPref('googleHost');//prefs refrenced in Services.js
  this.proxyURL='https://'+googleHost+'/__http0';
  //this.proxyURL='http://localhost/__http0';
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
  log('listening to port:'+this.serverSocket.port);
  if (false&&this.remoteProxy&&this.remoteProxy.getHost().indexOf('.dotcloud')>0){
      var dotcloudSocket = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);
      dotcloudSocket.init(-1,true,-1);
      var self=this;
      dotcloudSocket.asyncListen({
          onSocketAccepted : function(serverSocket, clientTransport) {
  transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
      var transport=transportService.createTransport(null,0,self.remoteProxy.getHost(), self.remoteProxy.getPort(),null);    
            var dotcloud    = new Dotcloud(transport);
            dotcloud.listen(clientTransport);
         }
      });
      log('dotcloudSocket listening to port:'+dotcloudSocket.port);
      this.dotcloudSocket=dotcloudSocket;
  }
};

LocalProxy.prototype.initializeProxyInfo = function() {
  var proxyService = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService(Components.interfaces.nsIProtocolProxyService);
  this.proxyInfo   = proxyService.newProxyInfo("http", "localhost", this.serverSocket.port, 0, 0, null);
  if(this.dotcloudSocket){
  this.dotcloudInfo   = proxyService.newProxyInfo("http", "localhost", this.dotcloudSocket.port, 0, 0, null);
  }
};

LocalProxy.prototype.onSocketAccepted = function(serverSocket, clientTransport) {
  //var serverTransport = this.connectToRemoteProxy();
    var dataShuffler    = new DataShuffler(this.proxyURL,this.appid,this.remoteProxy);
    dataShuffler.listen(clientTransport);
};
LocalProxy.prototype.onStopListening = function(serverSocket, status) {
    log('closing localhost:%s, status = %x',serverSocket.port,status);
};


LocalProxy.prototype.toString = function() {
    var info=this.proxyInfo;
  return info.type+'://' +info.host+':'+info.port+'\r\n\r\tconnect to:'+(this.remoteProxy||this.appid||'shared proxy');
};

