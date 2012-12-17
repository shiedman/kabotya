function ProxyManager() {
    this.enabled=false;
    this.selectedIndex=-1;
    this.localProxy=null;
    this.proxies = new Array();
    this.notifylist=new Array();
    this.loadPreferences();
    var protocolService=Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
    protocolService.registerFilter(this, 0);
    log('new ProxyManager');
}

ProxyManager.prototype.addNotify=function(notify){
    if(typeof(notify)=='object' && notify.onProxyUpdate){
        this.notifylist.push(notify);
        kabotyaExt.log('added notify:',this.notifylist.length);
    }
    return this;
};
ProxyManager.prototype.removeNotify=function(notify){
    var i=this.notifylist.indexOf(notify);
    if(i>=0)this.notifylist.splice(i,1);
    kabotyaExt.log('remove notify:',this.notifylist.length);
    if(i==0){
        this.savePreferences(true);
        log('saved preferences');
    }
};

ProxyManager.prototype.emit=function(topic){
      for(var i=0;i<this.notifylist.length;i++){
          this.notifylist[i].onProxyUpdate(topic);
      }
};
ProxyManager.prototype.shutdown=function(){
    //if(this.prefs)this.prefs.removeObserver("",this);
    log('shutdown proxymanager');
},
ProxyManager.prototype.currentProxy = function() {
    return this.proxies[this.selectedIndex];
};
/** should clear getter functions? **/
ProxyManager.prototype.getSelected = function() {
    return this.selectedIndex;
};

ProxyManager.prototype.getProxyCount = function() {
  return this.proxies.length;
};

ProxyManager.prototype.addProxy = function(proxy) {
  this.proxies.push(proxy);
};

ProxyManager.prototype.insertProxy = function(proxy, index) {
  this.proxies.splice(index, 0, proxy);
};

ProxyManager.prototype.getProxyList = function() {
  return this.proxies;
};

ProxyManager.prototype.getProxyAtIndex = function(index) {
  return this.proxies[index];
};

ProxyManager.prototype.removeProxyAtIndex = function(index) {
  this.proxies.splice(index, 1);
};

ProxyManager.prototype.savePreferences = function(silence) {
  var result='',changed=false,proxies=this.proxies;
  for (var i=0;i<proxies.length;i++) {
    //var proxyElement = 
    result+=proxies[i].serialize()+'|';
  }
  if(prefs.getIntPref('selectedIndex')!=this.selectedIndex){
      prefs.setIntPref('selectedIndex',this.selectedIndex);
      changed=true;
  }
  var proxiesString=result.substring(0,result.length-1);
  if(prefs.getCharPref('proxyList')!=proxiesString){
      prefs.setCharPref('proxyList',proxiesString);
      changed=true;
  }
  if(changed&&!silence){
      this.emit('menu');
  }
};
ProxyManager.prototype.loadPreferences = function() {
  var proxyList= prefs.getCharPref("proxyList");
  if (!proxyList) return;
  //this.loaded=true;
  this.selectedIndex=prefs.getIntPref("selectedIndex");
  var proxyElements = proxyList.split('|');

  for (var i=0;i<proxyElements.length;i++) {
    //var proxy = new kabotyaExt.Proxy();
    var proxy = new Proxy();
    proxy.deserialize(proxyElements[i]);
    this.proxies.push(proxy);
    //kabotyaExt.log(proxy);
  }
  if(this.selectedIndex >=this.proxies.length)this.selectedIndex=-1;
  var domains=prefs.getCharPref("domains");
  if(domains){
      domains = domains.split('|');
      for(var i=domains.length-1;i>=0;i--){
          if(domains[i].length<4)domains.splice(i,1);
      }
      this.domains=domains;
  }
};

var defaultProxies=['pprroxxyy1.appspot.com','pprroxxyy2.appspot.com','pprroxxyy3.appspot.com','pprroxxyy4.appspot.com'];
ProxyManager.prototype.defaultProxy = function() {
    //Using Math.round() will give you a non-uniform distribution!
    var n=Math.floor(Math.random() *(4-1+1)) + 1;
    var p=new Proxy();
    p.name='pprroxxyy'+n;p.host=p.name+'.appspot.com';p.port=80;
    p.shared=true;
    return p;
};
ProxyManager.prototype.applyFilter = function(protocolService, uri, aProxy) {
    var rtn=aProxy;
    if (this.enabled&&this.localProxy&&uri.path!='/__http0'){
        if(false&&this.localProxy.remoteProxy&&uri.scheme=='https'){
            log('[dotcloud]:%s://%s%s',uri.scheme,uri.host,uri.path);
            return this.localProxy.dotcloudInfo;
        }
        if(this.localProxy.remoteProxy || this.localProxy.appid){
            rtn=this.localProxy.getProxyInfo();
        }else if (uri.scheme=='http'){
            for(var i =0;i<this.domains.length;i++)
                if(uri.host.indexOf(this.domains[i])>=0) {
                    rtn=this.localProxy.getProxyInfo();break;
                }

        }
    }
    if(rtn)log('[%s]:%s://%s%s',rtn.host,uri.scheme,uri.host,uri.path);
    return rtn;
};
/**
ProxyManager.prototype.toggleFilter = function() {
    var protocolService=Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
    protocolService.unregisterFilter(this);
    if (this.localProxy) { this.localProxy.shutdown();this.localProxy=null; }

    if (this.enabled) {
        var proxy=this.currentProxy()||this.defaultProxy();
        this.localProxy = new LocalProxy(proxy);
        protocolService.registerFilter(this, 0);
    }
};
*/
ProxyManager.prototype.toggleProxy = function() {
    if (this.enabled) {
        var proxy=this.currentProxy();//||this.defaultProxy();
        if (this.localProxy) { this.localProxy.shutdown();}//this.localProxy.remoteProxy=proxy;}
        this.localProxy = new LocalProxy(proxy);
        log('change to proxy :',this.localProxy);
    }
};
ProxyManager.prototype.toggleEnable = function() {
    this.enabled=!this.enabled;
    this.toggleProxy();
    this.emit('enabled');
    kabotyaExt.log('enabled=',this.enabled);
};
ProxyManager.prototype.selectProxy = function(index) {
    if(index<0||index>=this.proxies.length)return;
    this.selectedIndex=(this.selectedIndex==index?-1:index);
    this.toggleProxy();
    this.emit('index');
};
