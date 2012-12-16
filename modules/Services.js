var EXPORTED_SYMBOLS = [ "kabotyaExt" ];
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
//Cu.import("resource://gre/modules/Services.jsm");
/**
 * kabotyaExt namespace.
 */
if ("undefined" == typeof(kabotyaExt)) {
    var kabotyaExt = { };
    var prefs = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService)
        .getBranch("extensions.kabotya.proxy.");
    prefs.QueryInterface(Ci.nsIPrefBranch);
};
function log(){
    //Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(msg);
    //dump(arguments.callee.caller.name+': ');
   /* 
    var s=arguments[0]||"";
	if (typeof s !="string"){
		s+="";
	}
    for(var i=1;i<arguments.length;i++){
		if (s.indexOf("%s")>=0){
			s=s.replace("%s",arguments[i]);
		}else{
			s+=" "+arguments[i];
        }
    }
    dump(new Date().toLocaleTimeString()+"    "+s+"\r\n");
   */ 
}
kabotyaExt.log=log;
var scriptloader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                            .getService(Ci.mozIJSSubScriptLoader);

scriptloader.loadSubScript("chrome://kabotya/content/include/Proxy.js",
        this,"UTF-8");
        //var context={};
scriptloader.loadSubScript("chrome://kabotya/content/include/ProxyManager.js",
        this,"UTF-8");
scriptloader.loadSubScript("chrome://kabotya/content/include/DataShuffler.js",
        this,"UTF-8");
scriptloader.loadSubScript("chrome://kabotya/content/include/LocalProxy.js",
        this,"UTF-8");



kabotyaExt.proxyManager=new ProxyManager();
kabotyaExt.LocalProxy=LocalProxy;
kabotyaExt.Proxy=Proxy;

