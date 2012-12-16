Components.utils.import("resource://kabotya/common.js");
Components.utils.import("resource://kabotya/kf.js");

function __log(msg){
    //dump(msg+'\r\n');
}
function onDocumentload123(event){
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
            kabotyaExt.removeGoogleLinks(doc,5);
        }else if(_host.indexOf('.9gal.com')>0 || _host.indexOf('.9baka.com')>0){
            if(_path.indexOf('diy_ad_move.php')>=0||_path.indexOf('g_intro.php')>=0){
                __log('parse ads page');
                kabotyaExt.kf.parseAdsPage(doc);
            }else{
                //dirty work
                __log('parse main page');
                kabotyaExt.kf.parseMainPage(doc);
            }
        }
    }
}
window.addEventListener("load", function(e) { 
    kabotyaExt.kf.init();
    gBrowser.addEventListener("load",onDocumentload123,true);
}, false); 
window.addEventListener("unload", function(e) { 
    __log('unload window');
    kabotyaExt.kf.cleanup();
    gBrowser.removeEventListener("load",onDocumentload123, true);
}, false); 
