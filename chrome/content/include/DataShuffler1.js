
function DataShuffler(clientTransport, serverTransport) {
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

DataShuffler.prototype.onStartRequest = function(request, context){};

DataShuffler.prototype.onStopRequest = function(request, context, status){
    this.serverInputStream.close();
    this.serverOutputStream.close();
    this.clientInputStream.close();
    this.clientOutputStream.close();
};

var HTTP_HEAD="POST /kabotya.png HTTP/1.0 \r\nHost: pprroxxyy.appspot.com\r\n\r\n";
DataShuffler.prototype.onDataAvailable1 = function(request, context, inputStream, offset, count) {
  if (inputStream == this.rawClientInputStream) {
      //if(this.status!="sending"){
          //this.status="sending";
          //this.serverOutStream.writeBytes(HTTP_HEAD,HTTP_HEAD.length);
      //}
    var data = this.clientInputStream.readByteArray(count);
//GET http:/
    if(data.length>10&&cpa(data,[0x47,0x45,0x54,0x20,0x68,0x74,0x74,0x70,0x3a,0x2f])){
        setarray(data,[0x2f,0x68,0x74,0x74,0x70,0x5f],4);//set to /http_
    }
//POST http:/
    if(data.length>11&&cpa(data,[0x50,0x4f,0x53,0x54,0x20,0x68,0x74,0x74,0x70,0x3a,0x2f]))
    {
        setarray(data,[0x2f,0x68,0x74,0x74,0x70,0x5f],5);//set to /http_
    }
    this.serverOutputStream.writeByteArray(data, count);
  } else {
    var data = this.serverInputStream.readByteArray(count);
    this.clientOutputStream.writeByteArray(data, count);
  }
};

DataShuffler.prototype.onDataAvailable = function(request, context, inputStream, offset, count) {
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

DataShuffler.prototype.pumpData = function(inputStream) {
  var dataPump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
  dataPump.init(inputStream, -1, -1, 0, 0, false);
  dataPump.asyncRead(this, null);
}

DataShuffler.prototype.shuffle = function() {
  this.pumpData(this.rawClientInputStream);
  this.pumpData(this.rawServerInputStream);
};

function checkHead(b){
}

function cpa(b1,b2,start){
    for(var i=start||0;i<b2.length;i++){
        if(b1[i]!=b2[i])return false;
    }
    return true;
}
function setarray(b1,b2,start){
    for(var i=start||0;i<b2.length;i++){
        b1[i]=b2[i];
    }
}

