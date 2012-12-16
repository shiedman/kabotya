"use strict";
const Cu=Components.utils;
Cu.import("resource://kabotya/Services.js");
//Cu.import("resource://kabotya/common.js");
//Cu.import("resource://kabotya/ProxyManager.js");
var y2proxyOptionsOverlay={};
(function(){
var proxyManager=kabotyaExt.proxyManager;
var list=[],n=-1;
function onOptionsLoad() {
    list=proxyManager.proxies.slice(0);
    for(var i=0;i<list.length;i++){
        list[i]=list[i].clone();
    }
    n=proxyManager.selectedIndex;
    update();
}
function onSaveProxy(){
    proxyManager.proxies=list;
    proxyManager.selectedIndex=n;
    proxyManager.savePreferences();
    kabotyaExt.log('saving preferences');
}
function getProxyTree() {
  return document.getElementById("proxyTree");
}
function onMoveProxyUp() {
  var tree = getProxyTree();
  var index = tree.currentIndex;

  if (index > 0) {
      //swap element at index and index-1
    var tmp = list[index];
    list[index]=list[index-1];
    list[index-1]=tmp;
    if(n==index)n--;
    else if(n==index-1)n++;
    //proxyManager.removeProxyAtIndex(index);
    //proxyManager.insertProxy(proxy, index-1);

    update();
    tree.view.selection.select(index-1);
  }
}
function onMoveProxyDown() {
  var tree = getProxyTree();
  var index = tree.currentIndex;
  kabotyaExt.log('index=',index);
  if (index+1 < list.length && index>=0) {
      //swap element at index and index+1
    var tmp=list[index];
    list[index]=list[index+1];
    list[index+1]=tmp;
    if(n==index)n++;
    else if(n==index+1)n--;
    //var proxy = proxyManager.getProxyAtIndex(index);

    //proxyManager.removeProxyAtIndex(index);
    //proxyManager.insertProxy(proxy, index+1);

    update();
    tree.view.selection.select(index+1);
  }
}
function onRemoveProxy() {
  var index = getProxyTree().currentIndex;
  if(index<0||index>=list.length)return;
  list.splice(index,1);
  update();
}
function onEditProxy() {
  var index=getProxyTree().currentIndex;
  if(index<0||index>=list.length)return;
  var proxy  = list[index];
  var retVal = {proxy: proxy};

  window.openDialog("chrome://kabotya/content/y2proxyAddEdit.xul", "dialog", "modal", retVal);
  update();
}
function onAddProxy() {
  var retVal = {proxy: null};
  window.openDialog("chrome://kabotya/content/y2proxyAddEdit.xul", "dialog", "chrome, modal, dialog, resizable=yes", retVal).focus();

  if (retVal.proxy) {
    list.push(retVal.proxy);
    update();
  }
}
function update() {
  var proxyTree      = getProxyTree();
  proxyTree.view     = {  
    rowCount : list.length,
    
    getCellText : function(row, column) {
      var proxy = list[row];

      if      (column.id == "proxyName") return proxy.getName();
      else if (column.id == "proxyHost") return proxy.getHost();
      else if (column.id == "proxyPort") return proxy.getPort();
    },  
    getCellValue: function(row, col) {
      return n==row;
    },
    setCellValue: function(row, col, val) {
      n=row;
      update();
    },
    setTree: function(treebox){this.treebox = treebox; },  
    isContainer: function(row){return false;},  
    isSeparator: function(row){ return false; },  
    isSorted: function(){ return false; },  
    isEditable: function(row, column) {
      if (column.id == "proxyEnabled") return true;
      else                             return false;
    },
    getLevel: function(row){ return 0; },  
    getImageSrc: function(row,col){ return null; },  
    getRowProperties: function(row,props){},  
    getCellProperties: function(row,col,props){},  
    getColumnProperties: function(colid,col,props){},
    cycleHeader:function(col){}
  };    

  //proxyManager.savePreferences();
}
//y2proxyOptionsOverlay.getProxyTree=getProxyTree;
//y2proxyOptionsOverlay.update=update;
y2proxyOptionsOverlay.onOptionsLoad=onOptionsLoad;
y2proxyOptionsOverlay.onMoveProxyUp=onMoveProxyUp;
y2proxyOptionsOverlay.onMoveProxyDown=onMoveProxyDown;
y2proxyOptionsOverlay.onRemoveProxy=onRemoveProxy;
y2proxyOptionsOverlay.onEditProxy=onEditProxy;
y2proxyOptionsOverlay.onAddProxy=onAddProxy;
y2proxyOptionsOverlay.onSaveProxy=onSaveProxy;
})();
