// ----      datashuffler  ----
var IOService = Components.classes["@mozilla.org/network/io-service;1"]
               .getService(Components.interfaces.nsIIOService);

function DataShuffler(proxyURL,appid,proxy) {
    this.hash=Date.now().toString(16)+Math.random().toString(16).substring(1);
    this.index=0;
    if(!appid)appid='pprroxxyy'+(Math.floor(Math.random() *(4-1+1)) + 1);
    this.host=appid+'.appspot.com';
    if(proxy){
        this.proxy=proxy.host;
        if(proxy.port!=80)this.proxy+=':'+proxy.port;
    }
    this.proxyURL=proxyURL;
}

DataShuffler.prototype.listen= function(clientTransport) {
    var rawClientOutputStream = clientTransport.openOutputStream(0,0,0);
    //this.output = clientTransport.openOutputStream(0,0,0);
    var rawClientInputStream  = clientTransport.openInputStream(0,0,0);

    this.input = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
    this.output = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);

    this.input.setInputStream(rawClientInputStream);
    this.output.setOutputStream(rawClientOutputStream);
    this.transport=clientTransport;
    var dataPump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
    dataPump.init(rawClientInputStream, -1, -1, 0, 0, false);
    dataPump.asyncRead(this, null);
};
var conns=0;
DataShuffler.prototype.onStartRequest = function(request, context){
    log('open:%s',++conns);
};

DataShuffler.prototype.onStopRequest = function(request, context, status){
    log('close:%s, status=0x%s',--conns,status.toString(16));
    this.input=null,this.output=null,this.transport=null;
};


DataShuffler.prototype.onDataAvailable = function(request, context, inputStream, offset, count) {
    var data=this.input.readBytes(count);
    this.send(data);
};

DataShuffler.prototype.send=function(chunk){
    var ch = IOService.newChannel(this.proxyURL, 0, null).QueryInterface(Components.interfaces.nsIHttpChannel);
    ch.setRequestHeader('Socket-Hash',this.hash,false);
    ch.setRequestHeader('Socket-Chunk',this.index,false);this.index++;
    if(this.host)ch.setRequestHeader('Host',this.host,false);
    if(this.proxy)ch.setRequestHeader('Socket-Proxy',this.proxy,false);

    var inputStream = Components.classes["@mozilla.org/io/string-input-stream;1"]
        .createInstance(Components.interfaces.nsIStringInputStream);
    inputStream.setData(chunk,chunk.length);

    var up=ch.QueryInterface(Components.interfaces.nsIUploadChannel);
    up.setUploadStream(inputStream, "application/octet-stream", -1);
    up.requestMethod = "POST";
    var self=this;
    up.asyncOpen({
        data:'',status:'', ins:null,
        onStartRequest:function(request,context){ 
            this.status=ch.getResponseHeader('Socket-Status');
            log('[write]response statusCode:%s,socket-status:%s',ch.responseStatus,this.status);
            //ch.visitResponseHeaders(function(k,v){log('%s: %s',k,v);});
        },
        onStopRequest:function(request, context, status){
            if(!self.transport)return;
            if (!Components.isSuccessCode(status)){
                log('close socket with status code :0x%s',status.toString(16));
                return self.transport.close(status);
            }
            if(this.status=='error'){
                log(chunk);
                var s='HTTP/1.1 500 ERROR\r\nContent-Type: text/plain\r\nContent-Length: '+this.data.length+'\r\n\r\n'+this.data+'\r\n';
                self.output.write(s,s.length);
                self.transport.close(Components.results.NS_ERROR_ABORT);
            }else if(this.status=='read'){
                log(this.data);
                var s='HTTP/1.1 200 Connection Established\r\nProxy-agent: y2proxy\r\n\r\n';
                self.output.write(s,s.length);
                self.read();
            }else{
            }
        },
        //bin:Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream),
        onDataAvailable:function(request, context, inputStream, offset, count) {
            if(!self.transport)return;
            //var scriptableInputStream =
                //Components.classes["@mozilla.org/scriptableinputstream;1"]
                //.createInstance(Components.interfaces.nsIScriptableInputStream);
            //scriptableInputStream.init(inputStream);

            //var data= scriptableInputStream.read(count);
           if(!this.ins){
               this.ins=Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
               this.ins.setInputStream(inputStream);
           }
           var data=this.ins.readBytes(count);
            if (this.status=='end'){
                //log(data);
                self.output.write(data,data.length);
            }else{
                this.data+=data;
            }
        }
    },null);
};

DataShuffler.prototype.read=function(){
    var ch = IOService.newChannel(this.proxyURL, 0, null).QueryInterface(Components.interfaces.nsIHttpChannel);
    ch.setRequestHeader('Socket-Hash',this.hash,false);
    if(this.host)ch.setRequestHeader('Host',this.host,false);
    if(this.proxy)ch.setRequestHeader('Socket-Proxy',this.proxy,false);

    ch.requestMethod = "GET";
    var self=this;
    ch.asyncOpen({
        status:'',ins:null,
        onStartRequest:function(request,context){
            this.status=ch.getResponseHeader('Socket-Status');
            log('[read]response statusCode:%s,socket-status:%s',ch.responseStatus,this.status);
        },
        onStopRequest:function(request, context, status){
            if(!self.transport)return;
            if (!Components.isSuccessCode(status)) return self.transport.close(status);
            if(this.status=='data'){
                self.read();
            }else{
                log('read socket failed');
                self.transport.close(Components.results.NS_ERROR_ABORT);
            }
        },
        onDataAvailable:function(request, context, inputStream, offset, count) {
            if(!self.transport)return;
            if (this.status=='data'){
               if(!this.ins){
                   this.ins=Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
                   this.ins.setInputStream(inputStream);
               }
                //var scriptableInputStream = //Components.classes["@mozilla.org/scriptableinputstream;1"]
                    //.createInstance(Components.interfaces.nsIScriptableInputStream);
                //scriptableInputStream.init(inputStream);

                //var data= scriptableInputStream.read(count);
                var data=this.ins.readBytes(count);
                self.output.write(data,data.length);
            }
        }
    },null);

};
