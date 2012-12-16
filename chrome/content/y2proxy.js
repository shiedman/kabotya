//var EXPORTED_SYMBOLS =['y2proxy'];
"use strict";
Cu.import("resource://kabotya/Services.js");
//const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
//Cu.import("resource://kabotya/common.js");
//Cu.import("resource://kabotya/ProxyManager.js");
//let Cc = Components.classes;
//let Ci = Components.interfaces;
//let Cu = Components.utils;

function  y2proxy_selectProxy(target){
    if(!target.hasAttribute('proxy'))return;
    var n=target.getAttribute('proxy');
    kabotyaExt.proxyManager.selectProxy(n);
}
var y2proxy = {
  enabled: false,
  menuCreated:false,
  startup: function(event) {
    var proxyManager=kabotyaExt.proxyManager;
    proxyManager.addNotify(this);//new ProxyManager();
    if(proxyManager.enabled!=this.enabled){
        this.enabled=proxyManager.enabled;
        this.updateCheckStatus();
    }
    function firstRun(exts) {
        var ext = exts.get("kabotya@shiedman.addons.mozilla.org");
        if (ext.firstRun) {
            // add button here.
            var navbar = document.getElementById("nav-bar");
            if(navbar.currentSet.indexOf('y2proxy-tbb')<0){
                var newset = navbar.currentSet + ",y2proxy-tbb";
                navbar.currentSet = newset;
                navbar.setAttribute("currentset", newset);
                document.persist("nav-bar", "currentset");
            }
        }
    }
    if (Application.extensions)
        firstRun(Application.extensions);
    else
        Application.getExtensions(firstRun);

  },

  shutdown: function(){
    //if(this.preferences)this.preferences.removeObserver("",this);
    //this.proxyManager.shutdown();
    kabotyaExt.proxyManager.removeNotify(this);
  },

  onProxyUpdate:function(topic){
    var proxyManager=kabotyaExt.proxyManager;
    if(topic=='menu'){
        this.menuCreated=false;
    }else if(topic=='enabled'){
        this.enabled=proxyManager.enabled;
        this.updateCheckStatus();
    }else if(topic=='index'){
        var n=proxyManager.getSelected();
        var menu1=document.getElementById('y2proxy-menuitems1');
        var menu2=document.getElementById('y2proxy-menuitems2');
        this.checkMenu(menu1.childNodes,n);
        this.checkMenu(menu2.childNodes,n);
    }
  },

  checkMenu:function(nodes,n){
    for(var i=0;i<nodes.length;i++){
        var item=nodes.item(i);
        if(!item.hasAttribute('proxy'))continue;
        item.setAttribute('checked',n==item.getAttribute('proxy'));
    }
  },

  updateCheckStatus: function() {
 var enabledEl = document.getElementById("proxy_toggle_enabled");
    (this.enabled ? enabledEl.removeAttribute('disabled'): enabledEl.setAttribute('disabled', 'yes'));
 var check1 = document.getElementById("y2proxy-checkmenu1");
 var check2 = document.getElementById("y2proxy-checkmenu2");
 check1.setAttribute('checked',this.enabled);
 check2.setAttribute('checked',this.enabled);
  },


  populateMenu: function(){
    if(this.menuCreated)return;
    var menu1=document.getElementById('y2proxy-menuitems1');
    var menu2=document.getElementById('y2proxy-menuitems2');
    this.createMenu(menu1);
    this.createMenu(menu2);
    this.menuCreated=true;
  },
  createMenu: function(menu){
    var nodes=menu.childNodes;
    for(var i=nodes.length-1;i>=0;i--){
        var item=nodes.item(i);
        if(item.hasAttribute("proxy")) menu.removeChild(item);
    }
    var menuitems=document.createDocumentFragment();
    var proxies=kabotyaExt.proxyManager.getProxyList();
    for(var i=0;i<proxies.length;i++){
        var tmpItem=document.createElement('menuitem');
        tmpItem.setAttribute('type','checkbox');
        tmpItem.setAttribute('label',proxies[i].getName());
        tmpItem.setAttribute('checked',kabotyaExt.proxyManager.getSelected()==i);
        tmpItem.setAttribute('proxy',i);
        //tmpItem.setAttribute("oncommand", "y2proxy.toggleProxy("+i+")");
        menuitems.appendChild(tmpItem);
    }
    menu.appendChild(menuitems);
  },
  clearCookie:function(){
    var host=content.document.location.hostname;
    if(!host)return;
    if(!window.confirm('clear all cookie of '+host))return;
    var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
                      .getService(Components.interfaces.nsICookieManager2);
    //var rs='Clear Cookie:'+host;
    for (var e = cookieMgr.getCookiesFromHost(host); e.hasMoreElements();) {
        var cookie = e.getNext().QueryInterface(Components.interfaces.nsICookie2);
        //rs+='\n'+cookie.host+','+cookie.name+','+cookie.path+',';
        cookieMgr.remove(cookie.host,cookie.name,cookie.path,false);
    }
    //LOG(rs);
    }
}
window.addEventListener("load", function(e) { 
    //dump(kabotyaExt.createProxy().name);
    //dump(Cc);
    y2proxy.startup(e); 
}, false); 
window.addEventListener("unload", function(e) { 
    y2proxy.shutdown(e); 
}, false); 
