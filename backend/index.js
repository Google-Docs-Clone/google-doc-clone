var express = require('express');
var http = require('http');
const cors = require('cors');


const base64 = require('byte-base64')

const session = require('express-session')
const mongoDBSession = require('connect-mongodb-session')(session)
const store = new mongoDBSession({
    uri: process.env.DB_CONNECT,
    collection: 'sessions'
})

const cookieParser = require('cookie-parser')

var app = express();
var server = http.createServer(app);
const persistence = new ylb.LeveldbPersistence('./storage')



const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use(cors());
app.use(express.static('build', {
    setHeaders: function(res, path) {
      res.set("X-CSE356", "6339f8feca6faf39d6089077");
    }
}));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(cookieParser())

app.use(
    session({
        secret: "session key",
        resave: false,
        store: store,
        saveUninitialized: false
    })
)

const controller = require('./routes/index')
app.use('/', controller)

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
        // persistence.getYDoc(docId).then((ydoc) => {
        //     res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.bytesToBase64(Y.encodeStateAsUpdate(ydoc)), id: -1})}\nevent:sync\n\n`);
        // })
        res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.bytesToBase64(Y.encodeStateAsUpdate(docs[docId].doc)), id: -1})}\nevent:sync\n\n`);
        docs[docId].clients.push(newClient);
    }else{
        docs[docId] = {
            clients: [],
            modified: false,
            doc: new Y.Doc()
        }
        let length = docs[docId].clients.length + 1;
        const newClient = {
            id: docId + length,
            res: res
        }

        docs[docId].clients.push(newClient)

        res.write(`id:${docId}\ndata:${JSON.stringify({updates: base64.bytesToBase64(new Uint8Array([0,0])), id: -1})}\nevent:sync\n\n`);
        
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

    //console.log(body)
    
    const update = base64.base64ToBytes(body.update) // update is state update

    //persistence.storeUpdate(docId, update)
    Y.applyUpdate(docs[docId].doc, update)

    docs[docId].clients.forEach(client => {
        //console.log('client write')
        client.res.write(`id:${docId}\ndata:${JSON.stringify({updates: body.update, id: body.id})}\nevent:update\n\n`)
    });

    res.json({
        status: 200
    })
    console.log(docs[docId].clients.length)

})


server.listen(4000, function(){
    console.log("server is running on port 4000");
})