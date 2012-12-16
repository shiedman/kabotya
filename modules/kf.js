var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://kabotya/common.js");

kabotyaExt.kf = {
    GIF:{"57":"48", "44":"35", "43":"34", "42":"33", "41":"32", "40":"31", "39":"30", "38":"29", "37":"28", "36":"27", "35":"26", "45":"36", "46":"37", "56":"47", "55":"46", "54":"45", "53":"44", "52":"43", "51":"42", "50":"41", "49":"40", "48":"39", "47":"38", "34":"25", "33":"24", "20":"11", "19":"10", "18":"09", "17":"08", "10":"01", "11":"02", "12":"03", "13":"04", "14":"05", "15":"06", "21":"12", "22":"13", "32":"23", "31":"22", "30":"21", "29":"20", "28":"19", "27":"18", "26":"17", "25":"16", "24":"15", "23":"14", "16":"07"},
    prefs:null,
    adstime:0,
    adsgif:"32",
    adslist:[],
    intervalId:0,
    referenced:0,
    init:function(){
        this.references++;
        if(this.pref)return;
        var pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService)
            .getBranch("extensions.9gal.");
        pref.QueryInterface(Ci.nsIPrefBranch);
        pref.addObserver("", this, false);
        this.pref=pref;
        this.adstime = parseInt(pref.getCharPref('adstime'))||0;
        var _gif = pref.getCharPref("gif");
        if(_gif && this.GIF[_gif])this.adsgif=this.GIF[_gif];

    },
    
    cleanup: function() {
        this.references--;
        if (this.references==0 && this.pref){this.pref.removeObserver("", this);this.pref=null;this.adslist=[];}
    },

    observe: function(subject, topic, data) {
         if(topic != "nsPref:changed") return;
         var pref=this.pref;
         switch (data) {
             case "adstime":
                 this.adstime=parseInt(pref.getCharPref('adstime'))||0;
                 break;
             case "gif":
                 var _gif = pref.getCharPref("gif");
                 if(_gif && this.GIF[_gif])this.adsgif=this.GIF[_gif];
                 break;
         }
     },

    resetAdsTime:function(){
        this.pref.setCharPref('adstime',"0");
    },

    unloadDocument:function(evt){
        var adsinfo=evt.target.getElementById('__adsinfo123__');
        var list=this.adslist;
        for(var i =0;i<list.length;i++){
            var _o=list[i];
            if(_o[0]==adsinfo){
                list.splice(i,1);break;
            }
        }
        if(list.length==0) clearInterval(this.intervalId);
    },

    parseAdsPage:function(doc){
        var metas=doc.getElementsByTagName('meta');
        for(var i=0;i<metas.length;i++){
            if(metas[i].httpEquiv=='refresh'){
                this.pref.setCharPref('adstime',""+Date.now());
            }
        }
    },

    parseMainPage:function(doc){
        var links=doc.getElementsByTagName('a');
        var userinfoDiv,adsLink;
        for(var i=0;i<links.length;i++){
            var href=links[i].href;
            if(!href)continue;
            if(href.indexOf('login.php?action=quit')>=0){
                //if(href && href.indexOf('login.php')>=0){
                userinfoDiv=links[i].parentNode;
            }
            if(href.indexOf('diy_ad_move.php')>=0||href.indexOf('g_intro.php')>=0){
                adsLink=links[i]; break;
            }
        }
        if(userinfoDiv){
            var spanX=doc.createElement('span');
            spanX.textContent='x';
            var spanClock=doc.createElement('span');
            spanClock.textContent='-';
            var imgTip=doc.createElement('img');
            imgTip.setAttribute('src','/1338129279/post/smile/em/em'+this.adsgif+'.gif');
            imgTip.setAttribute('height','24');
            imgTip.setAttribute('width','24');
            var aClick=doc.createElement('a');
            aClick.setAttribute('href',adsLink.href);
            aClick.setAttribute('target','_blank');
            aClick.appendChild(imgTip);
            
            var adsinfo=doc.createElement('span');
            adsinfo.id='__adsinfo123__';
            adsinfo.appendChild(spanX);
            userinfoDiv.insertBefore(adsinfo,userinfoDiv.firstChild);
            //var list=this.adslist;
            //list.push([adsinfo,spanX,spanClock,aClick]);
            //if(list.length==1){
                //this.beginClock();
            var self=this;
            doc.defaultView.setInterval(function(){
                //for(var i=0;i<list.length;i++){
                    self.updateClock([adsinfo,spanX,spanClock,aClick]);
                    //self.log(this.document.title+' - '+adsinfo.textContent);
                //}
            },2000);
            //}
            //doc.defaultView.addEventListener('unload',this.unloadDocument);
        }else{
            this.log('no userinfo');
        }
    },

    updateClock:function(list){
        var p=list[0];
        if(this.adstime<=1327031828511){
            if(p.firstChild!=list[1]){
                p.removeChild(p.firstChild);
                p.appendChild(list[1]);
            }
            return;
        }
        var t=Date.now()-this.adstime;
        var _5HOURS=5*60*60*1000;
        if(t>=_5HOURS){
            //var strHtml='<a href="'+adslink.href+'" target="_blank"><img src="/1338129279/post/smile/em/em'+self.adsgif+'.gif" height="24" width="24"></a>';
            if(p.firstChild!=list[3]){
                p.removeChild(p.firstChild);
                p.appendChild(list[3]);
            }
        }else{
            t=Math.floor((_5HOURS-t)/1000);
            var  hours=Math.floor(t/3600);
            var  mins=Math.floor((t-hours*3600)/60);if(mins<10)mins='0'+''+mins;
            var  secs=t%60;if(secs<10)secs='0'+''+secs;
            if(p.firstChild!=list[2]){
                p.removeChild(p.firstChild);
                p.appendChild(list[2]);
            }
            list[2].textContent=hours+':'+mins+':'+secs;
        }
    },

    log:function(msg){
        //if(!this.consoleService){ this.consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
        //}
        //this.consoleService.logStringMessage(msg);
    },


};


kabotyaExt.removeGoogleLinks=function(doc,retryTimes) {
    var ires = doc.getElementById('ires');
    if (ires == null) {
        retryTimes --;
        if (retryTimes > 0) { 
            setTimeout(function(){ this.removeGoogleLinks(doc,retryTimes);}, 500); 
        }
    }else{
        var as = ires.getElementsByTagName('a');
        for (var i = 0, _len = as.length; i < _len; ++ i) {
            as[i].removeAttribute('onmousedown');
        }
    }
};
/*
 *function xxxxxxxxxxxlog(msg) {
 *    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
 *        .getService(Components.interfaces.nsIConsoleService);
 *    consoleService.logStringMessage(msg);
 *}
 */

