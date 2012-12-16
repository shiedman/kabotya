
function Proxy() {
  this.name    = null;
  this.host    = null;
  this.port    = -1;
  this.type=null;
  this.shared=false;
}

Proxy.prototype.getHost = function() {
  return this.host;
};

Proxy.prototype.setHost = function(host) {
  this.host = host;
};

Proxy.prototype.getPort = function() {
  return this.port;
};

Proxy.prototype.setPort = function(port) {
  this.port = port;
};

Proxy.prototype.getName = function() {
  return this.name;
};

Proxy.prototype.setName = function(name) {
  this.name = name;
};

Proxy.prototype.serialize = function() {
    return this.name+":"+this.host+":"+this.port;
};

Proxy.prototype.deserialize = function(element) {
    var parts=element.split(":");
  this.name    = parts[0];
  this.host    = parts[1];
  this.port    = parts[2];
};

Proxy.prototype.toString = function() {
    return this.name+":"+this.host+":"+this.port;
};
Proxy.prototype.clone = function() {
    var tmp=new Proxy();
    tmp.name=this.name;tmp.host=this.host;tmp.port=this.port;
    return tmp;
};
