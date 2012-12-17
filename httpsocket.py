#!/usr/bin/env python
# coding=utf-8

import sys,os,logging,time,json
import urllib,urlparse,httplib

PROXY='otaku-yaru.dotcloud.com'
ERROR_HTML='''
<html><head>
<meta http-equiv="content-type" content="text/html;charset=utf-8">
<title>500 Server Error</title>
</head>
<body text=#000000 bgcolor=#ffffff>
<h1>Server Error</h1>
<h2>The server encountered an error and could not complete your request.</h2>
<p>%s</p>
</body></html>
'''
sockets={}
#--header--
#socket-key:<string>
#fragment-number:<number>
#socket-status:
    #write:end/upgrade/error/ready
    #read:data/timeout/close/error
#socket-host:<string>
#socket-proxy:<string>
'''
deprecated
socket-code[8bit]
0-2bit:control code
    0x0 continuation
    0xF connection close
4-7bit:status code
    0x1 text frame
    0x2 binary frame
    0x8 connection close
    0x9 ping
    0xA pong
'''
#def buildResposne(response):
    #status_line = '%d %s' % (response.status, httplib.responses.get(response.status, 'OK'))
    #return MyUtil.buildHead(status_line,response.getheaders())

def buildHead(status, header=()):
    rs='HTTP/1.1 %s \r\n'%status
    for (k,v) in header:
        rs+='%s: %s\r\n'%(k.title(),v)
    return rs+'\r\n'

def parseHead(s,header={}):
    for line in s.splitlines():
        k,_,v=line.partition(':')
        if _!=':':continue
        k=k.lower()
        if k.find('connection')>0:continue
        header[k]=v.strip()
    return header

class Response:
    def __init__(self,environ,start_response):
        self.env=environ
        self.writeHead=start_response
        self.key=environ.get('HTTP_SOCKET_KEY')

    def write(self,status,body=None,contentType='text/plain',headers=None):
        global sockets
        if self.key and self.key in sockets:
            sockets[self.key].working=False

        if not headers:headers=[]
        if body:headers.append(('Content-Type',contentType))
        rtn = []
        if isinstance(body,str):
            rtn= [body]
        elif isinstance(body,unicode):
            #gae sucks in unicode type,must convert to str
            rtn= [body.encode('utf-8')]
        elif isinstance(body,list):
            rtn = body 
        elif body==None:
            pass
        else:
            logging.info('response with : %s - %s',type(body),body)

        #listing=[k for k,v in sockets.iteritems() if v.ondata]
        #if len(listing):
            #headers.append(('socket-ondata',','.join(listing)))
        self.writeHead(status,headers)
        return rtn 
        #return [message]
    def send(self,msg):
        return self.write('200 OK',msg)

#---------------socket response----------------
    def end(self,body):
        return self.write('200 OK',body,'application/octet-stream',[('socket-status','end')])

    def ready(self,message='ok'):
        i=self.env.get('HTTP_FRAGMENT_INDEX')
        msg='socket[%s],fragment[%s]:%s'%(self.key,i,message)#sockets
        return self.write('200 OK',msg,headers=[('socket-status','ready')])

    def error(self,message='unknown'):
        logging.warn(message)
        return self.write('200 OK',message,headers=[('socket-status','error')])

class Request:
    def __init__(self,environ):
        self.env=environ
        self.key=environ.get('HTTP_SOCKET_KEY')
        self.method=environ['REQUEST_METHOD']
        self.path=environ['PATH_INFO']

    def fragmentIndex(self):
        return int(self.env.get('HTTP_FRAGMENT_INDEX') or -1)

    def socket(self):
        key=self.key
        if not key:return None
        global sockets
        if key not in sockets:
            sockets[key]=HttpSocket(key,self.env['HTTP_HOST'])#
        return sockets[key]

    def getheader(self,name):
        return self.env.get('HTTP_'+name.upper().replace('-','_')) if name else None;



class HttpSocket:
    path='/httpsocket'
    def __init__(self,key,host):
        self.key=key
        self.host=host
        self.chunks=[]
        self.current=0
        self.request={'raw':'','method':'','url':'','header':{},'body':''}
        self.working=False
        self.forward=False
        self.ondata=False

    def connect(self,targetHost):
        conn = httplib.HTTPConnection(PROXY, timeout=10)
        body=urllib.urlencode({'target_host':targetHost})
        headers={'content-type':'application/x-www-form-urlencoded','socket-key':self.key,'content-length':str(len(body))}
        conn.request('POST', self.path,body,headers)
        res=conn.getresponse()
        s=res.read()
        rtn = json.loads(s) if res.status==200 else {'errcode':1,'message':'server response with %s'%res.status}
        logging.debug('[%s][write][%s]%s',self.key,res.status,rtn if res.status==200 else s)
        return rtn

    def write(self):
        payload=''
        for c in self.chunks[self.current:]: payload+=c
        conn = httplib.HTTPConnection(PROXY, timeout=15)
        conn.request('PUT', self.path,body=payload,headers={'socket-key':self.key,'Content-Length':str(len(payload)),'Content-Type':'application/octet-stream'})
        res = conn.getresponse()
        s=res.read()
        #print 'write return with:',s
        rtn = json.loads(s) if res.status==200 else {'errcode':1,'message':'server response with %s'%res.status}
        #no matter what response code is, chunk sended.
        self.current=len(self.chunks)
        #wsgi sucks in unicode type,must convert to str
        logging.debug('[%s][write][%s]%s',self.key,res.status,rtn if res.status==200 else s)
        return rtn


    def read(self):
        conn = httplib.HTTPConnection(PROXY, timeout=10)
        conn.request('GET', self.path,headers={'socket-key':self.key,'callback-url':'http://'+self.host+'/__http0/ondata'})
        response = conn.getresponse()
        status=response.status
        if status==200:
            return response.read(),'data'
        elif status==598:
            return None,'timeout'
        else:
            logging.warn('socket read return with response status: %s',status)
            return None,'error'

def handle_write(req,res):
    chunk=req.env['wsgi.input'].read(int(req.env.get('CONTENT_LENGTH') or -1));
    socket=req.socket()
    _t=0
    #logging.debug('waiting for socket.working:%s',socket.working)
    while socket.working:
        time.sleep(0.5); _t+=0.5
        if _t>=20:return res.error('timeout, server not response in %ss'%_t)

    socket.working=True
    #check chunk integrid
    chunks=socket.chunks
    n=req.fragmentIndex()

    #upload old chunk,error!
    if(n<socket.current):return res.error('[chunk index]%s < [current]%s'%(n,socket.current))

    logging.debug('socket[%s],chunk[%s]',req.key,n);
    if n==len(chunks):
        chunks.append(chunk)
    elif n>len(chunks):
        for i in range(len(chunks),n):
            chunks.append(None)
        chunks.append(chunk)
    else:
        chunks[n]=chunk
    for i in range(socket.current,len(chunks)):
        if chunks[i]==None:#bang, the chunk is missing(not received?)
             return res.ready("chunk[%s] missing"%i)

    if socket.forward:
        try:
            rtn=socket.write()
            if rtn['errcode']==0:
                return res.write('200 OK',rtn['message'],'application/octet-stream',[('socket-status','ondata')])
            else:
                return res.error(rtn['message'])
            #return res.ready(rtn['message']) if rtn['errcode']==0 else 
        except Exception as e:
            logging.exception('socket write failed')
            return res.error(str(type(e))+':'+str(e))

    request=socket.request
    for c in chunks[socket.current:]:
        request['raw']+=c
    socket.current=len(chunks)

    if not request['url']:
        s=request['raw']
        n=s.find('\r\n')
        if n<0: return res.ready('request line not found in string:\r\n%s'%s)
        if n==0:return res.error('request line begin with \\r\\n')
        line=s[:n]
        parts=line.split()
        if len(parts)!=3:
            return res.error('request line invalid: %s'%line)
        method,path,ver=parts
        if method not in ('CONNECT','OPTION','HEAD','DELETE','TRACE','GET','POST','PUT') and ver[:4]=='HTTP':
            return res.error('request line invalid : %s'%line)
        request['method'],request['url']=method,path
        request['raw']=s[n:]
        logging.debug('request line: %s'%line)

    if request['url'] and not request['header']:
        s=request['raw']
        n=s.find('\r\n\r\n')
        if n<0: return res.ready('head terminator \\r\\n\\r\\n NOT FOUND')
        head=s[:n].strip()
        request['header']=parseHead(head)
        request['raw']=s[n+4:]
        #logging.debug('header = %s'%request['header'])

    if request['url'] and request['header']:
        body=request['raw']
        header=request['header']
        length=int(header.get('content-length') or -1)
        transfer_encoding=header.get('transfer-encoding')
        method=request['method']
        if length>=0 and method in ('PUT','POST'):
            if len(body)<length:return res.ready('content-length:%s/%s'%(len(body),length))
            else: request['body']=body[:length]
        elif transfer_encoding=='chunked' and method in ('PUT','POST'):
            #parse chunked request body.well,it's really dirty code
            i=0
            while True:
                j=body.find('\r\n',i)
                if j<0:
                    request['raw']=body[i:]
                    return res.ready('chunk transfer not finished,i=%s\r\n%s'%(i,body[i:i+10]))
                try:
                    #read chunk-size,skip chunk-extension,e.g:2D;a=1;b=2\r\n
                    size=int(body[i:j].split(';')[0],16)
                except ValueError:
                    return res.error('chunk size invalid:%s'%body[i:j])
                if size==0:break#last chunk
                j+=2
                if j+size+2>len(body):
                    request['raw']=body[i:]
                    return res.ready('chunk transfer not finished,j=%s,size=%s,length=%s'%(j,size,len(body)))
                #check chunk if end of CRLF
                if body[j+size:j+size+2]!='\r\n':return res.error('chunk not ended with \\r\\n')
                request['body']+=body[j:j+size]
                i=j+size+2
                #if str[i:i+2]!='\r\n':raise Exception('invalid chunk format')

            del header['transfer-encoding']
            header['content-length']=len(request['body'])
            #parse trailer header
            head=body[i+3:].strip()
            if len(head)>0:
                parseHead(head,header)
                logging.info('trailer header - %s\r\n%s',request['url'],head)
        else:
            if 'transfer-encoding' in header:del header['transfer-encoding']
            if 'content-type' in header:del header['content-type']
            if 'content-length' in header:del header['content-length']
            request['body']=None

    socket.request={'raw':'','method':'','url':'','header':{},'body':''}
    socket.working=False
    url=request['url']
    method=request['method']
    if method =='CONNECT':
        try:
            rtn=socket.connect(url)
            if rtn['errcode']==0:
                socket.forward=True
                logging.debug('connected to %s',url)
                return res.write('200 OK',rtn['message'],
                                 headers=[('socket-status','upgrade'),('socket-protocol','https')])
            else:
                logging.info('connect failed - %s :%s',url,rtn['message'])
                return res.error(rtn['message'])
        except Exception as e:
            logging.exception('Failed to connect to: %s',url)
            return res.error(str(type(e))+':'+str(e))

    socket_proxy=req.getheader('socket-proxy')
    if socket_proxy:
        netloc = socket_proxy
        request['header']['x-real-host']=request['header']['host']
        request['header']['host']=netloc
        path=url.replace('http://','/__http0__/')
        scheme='http'
    else:
        scheme, netloc, path, params, query, fragment = urlparse.urlparse(url)
        if params: path += ';' + params
        if query: path += '?' + query
        if not netloc: netloc=request['header']['host']
    HTTPConnection = httplib.HTTPSConnection if scheme == 'https' else httplib.HTTPConnection
    conn = HTTPConnection(netloc, timeout=15)
    #developer no cotroller connection header, gae controll it
    #headers={k.title():v for k,v in request['header'].iteritems() if k.find('connection')<0}
    #headers['Connection']='close'
    try:
        #logging.debug('%s %s - [body]:%s',method,url,request['body'])
        conn.request(method, path, body=request['body'], headers=request['header'])
        response = conn.getresponse()
        status_line = '%d %s' % (response.status, httplib.responses.get(response.status, 'OK'))
        logging.debug('%s %s - %s',method,url,status_line)
        #logging.debug('%s %s - %s \r\n%s',method,url,status_line,out_headers)
        #check if loop infinitly
        if response.status==302 and response.getheader('location')==url:
            msg='HTTP cycle occured'
            logging.warn(msg)
            response.close()
            #start_response('200 OK', [('Content-Type','application/octet-stream'), ('socket-status','end') ])
            return res.end([buildHead('406 Not Acceptable',[('Content-Type','text/plain'),('Content-Length',str(len(msg)))]),msg])

        res_headers=[(k,v) for (k,v) in response.getheaders() 
                     if k not in('content-length','connection','x-google-cache-control','transfer-encoding')]
        body=response.read()
        response.close()
        res_headers.append(('content-length',str(len(body)) if body else '0'))
        return res.end([buildHead(status_line, res_headers),body])

    #except httplib.HTTPException as e:
    except Exception as e:
        msg= ERROR_HTML % (str(type(e))+':'+str(e))
        logging.exception('Failed to connect: %s',url)
        #start_response('200 OK', [('Content-Type','application/octet-stream'), ('socket-status','end') ])
        return res.end([buildHead('500 Connection Error',[('Content-Type','text/html'),('Content-Length',str(len(msg)))]),msg])
        #raise

def handle_read(req,res):
    socket=req.socket()
    socket.ondata=False
    try:
        chunk,status=socket.read()
        #status='data' if chunk else 'close'
        rtn=res.write('200 OK',chunk,'application/octet-stream',headers=[('socket-status',status)])
    except Exception as e:
        logging.exception('socket read failed')
        rtn= res.error(str(type(e))+':'+str(e))
    socket.ondata=False
    return rtn


def app(environ, start_response):
    global sockets
    req=Request(environ)
    res=Response(environ,start_response)
    if req.path.find('/__http0/recycle')==0:
        sockets={k:v for k,v in sockets.iteritems() 
                 if time.time()-int(k.partition('.')[0],16)/1000>3000  }
        return res.send('recycle is done')
    if not req.key:
        serverInfo = ["%s: %s" % (key, value)
               for key, value in environ.iteritems()]
        serverInfo='\r\n'.join(serverInfo)
        head='server info:\r\n\r\n';
        return res.send([head,serverInfo])

    method=req.method
    key=req.key
    if method =='GET':
        if key not in sockets:
            return res.write('400 Bad Request','%s not existed'%key)
        if req.path.find('/__http0/ondata')==0:
                sockets[key].ondata=True
                logging.warn('[%s] emit data event',key)
                return res.send('update successfully')
        return handle_read(req,res)
    elif method == 'POST':
        return handle_write(req,res)
    else:
        msg='METHOD %s NOT SUPPORT' % method;
        logging.warn(msg)
        return res.write('500 ERROR',msg)



def run_server():
    logging.basicConfig(level=logging.DEBUG, format='%(levelname)s - - %(asctime)s %(message)s', datefmt='[%b %d %H:%M:%S]')
    import gevent, gevent.pywsgi, gevent.monkey
    gevent.monkey.patch_all(dns=gevent.version_info[0]>=1)
    def read_requestline(self):
        line = self.rfile.readline(8192)
        while line == '\r\n':
            line = self.rfile.readline(8192)
        return line
    gevent.pywsgi.WSGIHandler.read_requestline = read_requestline
    host, _, port = sys.argv[1].rpartition(':') if len(sys.argv) == 2 else ('', ':', 443)
    if '-ssl' in sys.argv[1:]:
        ssl_args = dict(certfile=os.path.splitext(__file__)[0]+'.pem')
    else:
        ssl_args = dict()
    server = gevent.pywsgi.WSGIServer((host, int(port)), app, **ssl_args)
    server.environ.pop('SERVER_SOFTWARE')
    logging.info('serving %s://%s:%s/wsgi.py', 'https' if ssl_args else 'http', server.address[0] or '0.0.0.0', server.address[1])
    server.serve_forever()

if __name__ == '__main__':
    run_server()
    '''
    if len(sys.argv)==1:
        print 'appid needed'
        exit()
    appid=sys.argv[1]
    with open('app.yaml','rb') as f:lines=f.read()
    out=open('app.yaml','wb')
    for line in lines.splitlines(True):
        if line.find('your_appid')>=0:
            out.write(line.replace('your_appid',appid))
        else:
            out.write(line)
    out.close()
    '''


