// ----      datashuffler  ----
var IOService = Components.classes["@mozilla.org/network/io-service;1"]
               .getService(Components.interfaces.nsIIOService);
var SHUFFLERS={};
var read_request_time=Date.now();
function DataShuffler(proxyURL,appid,proxy) {
    this.hash=Date.now().toString(16)+Math.random().toString(16).substring(1);
    this.fragmentIndex=0;
    if(!appid)appid='pprroxxyy'+(Math.floor(Math.random() *(4-1+1)) + 1);
    this.host=appid+'.appspot.com';
    if(proxy){
        this.proxy=proxy.host;
        if(proxy.port!=80)this.proxy+=':'+proxy.port;
    }
    this.proxyURL=proxyURL;
    this.reading=false;
    this.protocol='http';
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
var shuffler_conns=0;
DataShuffler.prototype.onStartRequest = function(request, context){
    log('[%s]opened,conns:%s',this.hash,++shuffler_conns);
    SHUFFLERS[this.hash]=this;
    this.input.close=function(){log('closing dumy input');}
};

DataShuffler.prototype.onStopRequest = function(request, context, status){
    log('[%s]closed,conns:%s, status=%x',this.hash,--shuffler_conns,status);
    this.input=null,this.output=null,this.transport=null;
    delete SHUFFLERS[this.hash];
};


DataShuffler.prototype.onDataAvailable = function(request, context, inputStream, offset, count) {
    var data=this.input.readBytes(count);
    //log('available:%s',this.input.available());
    this.send(data);
    //this.send(this.input,count);
};

DataShuffler.prototype.send=function(chunk){
    var http = IOService.newChannel(this.proxyURL, 0, null).QueryInterface(Components.interfaces.nsIHttpChannel);
    http.setRequestHeader('socket-key',this.hash,false);
    http.setRequestHeader('fragment-index',this.fragmentIndex,false);this.fragmentIndex++;
    http.setRequestHeader('socket-protocol',this.protocol,false);
    if(this.host)http.setRequestHeader('Host',this.host,false);
    if(this.proxy)http.setRequestHeader('socket-proxy',this.proxy,false);

    var inputStream = Components.classes["@mozilla.org/io/string-input-stream;1"]
        .createInstance(Components.interfaces.nsIStringInputStream);
    inputStream.setData(chunk,chunk.length);
    var upload=http.QueryInterface(Components.interfaces.nsIUploadChannel);
    upload.setUploadStream(inputStream, "application/octet-stream", chunk.length);
    upload.requestMethod = "POST";

    var self=this;
    upload.asyncOpen({
        data:'',status:'', ins:null,
        onStartRequest:function(request,context){ 
            log('[write]sended %s bytes',chunk.length);
            if (!http.requestSucceeded){ 
                log('[write][ERROR]response %s-%s',http.responseStatus,http.getResponseHeader('socket-status'));
                return self.transport.close(Components.results.NS_ERROR_PROXY_CONNECTION_REFUSED); }
            this.status=http.getResponseHeader('socket-status');

            //var ondatalist=http.getResponseHeader('socket-ondata');
            //http.visitResponseHeaders(function(k,v){log('%s: %s',k,v);});

            //var listener=this,ondatalist=null;
            //http.visitResponseHeaders(function(k,v){
                //if(k=='socket-status')listener.status=v;
                //if(k=='socket-ondata')ondatalist=v;
            //});
            //if(ondatalist && Date.now()-read_request_time>1500){
                //read_request_time=Date.now()
                //log('ondatalist :%s',ondatalist);
                //var shufflers=ondatalist.split(',');
                //for(var i=shufflers.length-1;i>=0;i--){
                    //var shuffler=SHUFFLERS[shufflers[i]];
                    //if(shuffler)shuffler.read();
                //}
                //read_request_time=Date.now()
            //}
            log('[write]response %s-%s',http.responseStatus,this.status);
        },
        onStopRequest:function(request, context, httpStatus){
            if(!self.transport)return;
            //if (!Components.isSuccessCode(httpStatus)){
                //log('close socket with status code :%x',httpStatus);
                //return self.transport.close(httpStatus);
            //}
            switch(this.status){
                case 'error':
                    if(self.protocol=='http'){
                        log(chunk);
                        var echo='HTTP/1.1 500 ERROR\r\nContent-Type: text/plain\r\nContent-Length: '+this.data.length+'\r\n\r\n'+this.data;
                        log('[error]%s',this.data);
                        self.output.writeBytes(echo,echo.length);
                    }
                    //self.transport.close(Components.results.NS_ERROR_ABORT);
                    break;
                case 'upgrade':
                    self.protocol=http.getResponseHeader('socket-protocol');
                    if(self.protocol=='https'){
                        var echo='HTTP/1.1 200 Connection Established\r\nProxy-agent: y2proxy\r\n\r\n';
                        self.output.write(echo,echo.length);
                        //self.read();
                    }
                    log(this.data);
                    break;
                case 'ondata':
                    self.read();
                    break;
            }
        },
        onDataAvailable:function(request, context, inputStream, offset, count) {
            if(!self.transport)return;
            /*
             *var scriptableInputStream =
             *    Components.classes["@mozilla.org/scriptableinputstream;1"]
             *    .createInstance(Components.interfaces.nsIScriptableInputStream);
             *scriptableInputStream.init(inputStream);
             *var data= scriptableInputStream.read(count);
             */
           if(!this.ins){
               this.ins=Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
               this.ins.setInputStream(inputStream);
           }
           var data=this.ins.readBytes(count);
            if (this.status=='end'){
                self.output.writeBytes(data,data.length);
            }else{
                this.data+=data;
            }
        }
    },null);
};

DataShuffler.prototype.read=function(){
    if(this.reading)return;
    //log('reading = %s',this.reading);
    this.reading=true;
    var http = IOService.newChannel(this.proxyURL, 0, null).QueryInterface(Components.interfaces.nsIHttpChannel);
    http.setRequestHeader('socket-key',this.hash,false);
    http.setRequestHeader('socket-protocol',this.protocol,false);
    if(this.host)http.setRequestHeader('Host',this.host,false);
    if(this.proxy)http.setRequestHeader('socket-proxy',this.proxy,false);
    http.requestMethod = "GET";

    var self=this;
    http.asyncOpen({
        status:'',ins:null,
        onStartRequest:function(request,context){
            if (!http.requestSucceeded){self.transport.close(Components.results.NS_ERROR_PROXY_CONNECTION_REFUSED); }
            this.status=http.getResponseHeader('socket-status');
            log('[read]response %s-%s',http.responseStatus,this.status);
        },
        onStopRequest:function(request, context, httpStatus){
            self.reading=false;
            if(!self.transport)return;
            switch(this.status){
                case 'data':
                    self.read();
                    break;
                case 'timeout':
                    //do nothing
                    break;
                case 'close':
                    log('[read]socket closed');
                    self.transport.close(Components.results.NS_ERROR_NO_CONTENT);
                    break;
                case 'error':
                    log('[read]socket error');
                    self.transport.close(Components.results.NS_ERROR_ABORT);
                    break;
            }
        },
        onDataAvailable:function(request, context, inputStream, offset, count) {
            if(!self.transport)return;
            if (this.status=='data'){
                if(!this.ins){
                    this.ins=Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
                    this.ins.setInputStream(inputStream);
                }
                var data=this.ins.readBytes(count);
                log('[read]%s bytes',data.length);
                self.output.writeBytes(data,data.length);
            }
        }
    },null);

};
