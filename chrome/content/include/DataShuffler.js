// ----      datashuffler  ----

function DataShuffler(clientTransport, serverTransport,host) {
    //this.host=host;
    if(host.indexOf('.appspot.com')>0){
        this.host='\r\nHost: '+host+'\r\nX-Host:';
		/*
        this.hostarray=new Array(host.length);
        for(var i=0;i<host.length;i++){
            this.hostarray[i]=host.charCodeAt(i);
        }*/
    }
  this.rawClientOutputStream = clientTransport.openOutputStream(0,0,0);
  this.rawServerOutputStream = serverTransport.openOutputStream(0,0,0);

  this.rawClientInputStream  = clientTransport.openInputStream(0,0,0);
  this.rawServerInputStream  = serverTransport.openInputStream(0,0,0);

  this.clientInputStream     = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
  this.serverInputStream     = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);

  this.clientOutputStream    = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
  this.serverOutputStream    = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);

  this.clientInputStream.setInputStream(this.rawClientInputStream);
  this.serverInputStream.setInputStream(this.rawServerInputStream);

  this.clientOutputStream.setOutputStream(this.rawClientOutputStream);
  this.serverOutputStream.setOutputStream(this.rawServerOutputStream);
}
var conns=0;
DataShuffler.prototype.onStartRequest = function(request, context){
    log('open:%s',++conns);
};

DataShuffler.prototype.onStopRequest = function(request, context, status){
    this.serverInputStream.close();
    this.serverOutputStream.close();
    this.clientInputStream.close();
    this.clientOutputStream.close();
    log('close:%s, status=%s',--conns,status);
};

DataShuffler.prototype.pumpData = function(inputStream) {
  var dataPump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
  dataPump.init(inputStream, -1, -1, 0, 0, false);
  dataPump.asyncRead(this, null);
}

DataShuffler.prototype.shuffle = function() {
  this.pumpData(this.rawClientInputStream);
  this.pumpData(this.rawServerInputStream);
};

DataShuffler.prototype.onDataAvailable = function(request, context, inputStream, offset, count) {
    if(this.host){
        this.gaeProxy(inputStream,count);
    }else{
        this.dotcloudProxy(inputStream,count);
    }
}
DataShuffler.prototype.dotcloudProxy = function(inputStream,count) {
  if (inputStream == this.rawClientInputStream) {
    var data = this.clientInputStream.readByteArray(count);
    for(var i=0;i<data.length;i++){
		data[i] = data[i]^0x88;
    }
    this.serverOutputStream.writeByteArray(data, count);
  } else {
    var data = this.serverInputStream.readByteArray(count);
    for(var i=0;i<data.length;i++){
        data[i] = data[i]^0x88;
    }
    this.clientOutputStream.writeByteArray(data, count);
  }
};

//var HTTP_HEAD="POST /kabotya.png HTTP/1.0 \r\nHost: pprroxxyy.appspot.com\r\n\r\n";
          //this.serverOutStream.writeBytes(HTTP_HEAD,HTTP_HEAD.length);
//\r\nHost: pprroxxyy.appspot.com
//var hostarray=[0xd,0xa,0x48,0x6f,0x73,0x74,0x3a,0x20,0x70,0x70,0x72,0x72,0x6f,0x78,0x78,0x79,0x79,0x2e,0x61,0x70,0x70,0x73,0x70,0x6f,0x74,0x2e,0x63,0x6f,0x6d];
DataShuffler.prototype.gaeProxy1 = function(inputStream, count) {
  if (inputStream == this.rawClientInputStream) {
      if(this.status!="sending"){
          this.status="sending";
          //var reqline=this.clientInputStream.readBytes(count);
          //this.serverOutputStream.writeBytes(reqline,reqline.length);
            var data = this.clientInputStream.readByteArray(count);
            var buffer=new Array(data.length+this.hostarray.length);//-'\r\nHost: sora-yaru.dotcloud.com'.length);
            for(var i=0,n=0;i<data.length;i++,n++){
                if(cparray(data,[0x68,0x74,0x74,0x70,0x3a,0x2f],i)){ /* http:/   */
                    setarray(buffer,[0x2f,0x68,0x74,0x74,0x70,0x5f],i);/* /http_  */
                    i+=6;n+=6;break;
                }else{
                    buffer[n]=data[i];
                }
            }
            for(;i<data.length;i++,n++){
                if(cparray(data,[0x0d,0x0a,0x48,0x6f,0x73,0x74,0x3a],i)){/*\r\nHost:*/
                    setarray(buffer,this.hostarray,n);
                    i+=7;n+=this.hostarray.length; break;
                }else{
                    buffer[n]=data[i];
                }
            }
            /*
            for(;i<data.length;i++){
                if(data[i]==0x0d&&data[i+1]==0x0a)break; //\r\n
            }*/
            for(;i<data.length;i++,n++){
                buffer[n]=data[i];
            }
            this.serverOutputStream.writeByteArray(buffer, n);
      }else{
    var data = this.clientInputStream.readByteArray(count);
    this.serverOutputStream.writeByteArray(data, count);
      }
  } else {
      if(this.status!="receiving"){ this.status="receiving"; }
    var data = this.serverInputStream.readByteArray(count);
    this.clientOutputStream.writeByteArray(data, count);
  }
};
DataShuffler.prototype.gaeProxy = function(inputStream, count) {
  if (inputStream == this.rawClientInputStream) {
      if(this.status!="sending"){
          this.status="sending";
             var data = this.clientInputStream.readBytes(count);
            var x1=data.indexOf('http:/');
            var x2=data.indexOf('\r\nHost:',x1+6);
            var msg=data.substring(0,x1)+'/http_'+data.substring(x1+6,x2)+this.host+data.substring(x2+7);
            this.serverOutputStream.writeBytes(msg,msg.length);
      }else{
    var data = this.clientInputStream.readByteArray(count);
    this.serverOutputStream.writeByteArray(data, count);
      }
  } else {
      if(this.status!="receiving"){ this.status="receiving"; }
    var data = this.serverInputStream.readByteArray(count);
    this.clientOutputStream.writeByteArray(data, count);
  }
};
function cparray(b1,b2,start){
    start=start||0;
    for(var i=0;i<b2.length;i++){
        if(b1[start+i]!=b2[i])return false;
    }
    return true;
}
function setarray(b1,b2,start){
    start=start||0;
    for(var i=0;i<b2.length;i++){
        b1[start+i]=b2[i];
    }
}
function xlog(msg){
  //var transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
    //Components.classes["@mozilla.org/consoleservice;1"].
        //getService(Components.interfaces.nsIConsoleService).
        //logStringMessage(msg);
            //dump(msg+'\r\n');
}
