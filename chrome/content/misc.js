(function(){
function pageLoad(event){
    var doc = event.originalTarget;
    if (doc instanceof HTMLDocument) {
        // is this an inner frame?
        if (doc.defaultView.frameElement) {
            // Frame within a tab was loaded.
            // Find the root document:
            while (doc.defaultView.frameElement) {
                doc = doc.defaultView.frameElement.ownerDocument;
            }
        }
        var _host=doc.location.hostname;
        var _path=doc.location.pathname;
        if(_host.indexOf('.google.com')>0&& _path.indexOf('/search')==0){
            removeGoogleLinks(doc,5);
        }
    }
}
function removeGoogleLinks(doc,retryTimes) {
    var ires = doc.getElementById('ires');
    if (ires == null) {
        retryTimes --;
        if (retryTimes > 0) { 
            setTimeout(function(){ removeGoogleLinks(doc,retryTimes);}, 500); 
        }
    }else{
        var as = ires.getElementsByTagName('a');
        for (var i = 0, _len = as.length; i < _len; ++ i) {
            as[i].removeAttribute('onmousedown');
        }
        //dump('try:'+retryTimes+' , remove:'+as.length+'\r\n');
    }
}

window.addEventListener("load", function(e) { 
    gBrowser.addEventListener("load",pageLoad,true);
}, false); 
window.addEventListener("unload", function(e) { 
    gBrowser.removeEventListener("load", pageLoad, true);
}, false); 
})();
