const ylb = require("y-leveldb")
const Y = require('yjs')
const base64 = require('js-base64')

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
const persistence = new ylb.LeveldbPersistence('./storage')

const cors = require('cors');
app.use(cors());
app.use(express.static('build', {
    setHeaders: function(res, path) {
      res.set("X-CSE356", "6339f8feca6faf39d6089077");
    }
}));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

var docs = {}

app.get('/api/connect/:id', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    res.flushHeaders();
    
    let docId = req.params.id;

    if (docs.hasOwnProperty(docId)){ // is running docId
        let length = docs[docId].clients.length + 1;
        const newClient = {
            id: docId + '-' + length,
            res: res
        }
        persistence.getYDoc(docId).then((ydoc) => {
            res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.fromUint8Array(Y.encodeStateAsUpdate(ydoc)), id: -1})}\nevent:sync\n\n`);
        })
        //res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.fromUint8Array(Y.encodeStateAsUpdate(docs[docId].doc)), id: -1})}\nevent:sync\n\n`);
        docs[docId].clients.push(newClient);
    }else{
        docs[docId] = {
            clients: [],
            modified: false,
            //doc: new Y.Doc()
        }
        let length = docs[docId].clients.length + 1;
        const newClient = {
            id: docId + length,
            res: res
        }

        docs[docId].clients.push(newClient)

        res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.fromUint8Array(new Uint8Array([0,0])), id: -1})}\nevent:sync\n\n`);
        
        req.on('close', () => {
            docs[docId].clients = docs[docId].clients.filter(client => client.id !== newClient.id);
            res.end()
        })
    }

})

app.post('/api/op/:id', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');

    
    let docId = req.params.id;
    let body = req.body;
    
    const update = base64.toUint8Array(body.update) // update is state update

    persistence.storeUpdate(docId, update)
    //Y.applyUpdate(docs[docId].doc, update)

    sendUpdates(docId, body.update, body.id);

    res.json({
        status: 200
    })

})

function sendUpdates(docId, stateUpdate, id) {
    docs[docId].clients.forEach(client => {
        client.res.write(`id:${docId}\ndata:${JSON.stringify({updates: stateUpdate, id: id})}\nevent:update\n\n`)
    });
}


server.listen(4000, function(){
    console.log("server is running on port 4000");
})