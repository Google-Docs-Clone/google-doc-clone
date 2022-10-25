var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

const cors = require('cors');
app.use(cors());

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
        res.write(`id:${docId}\ndata:${JSON.stringify(docs[docId].updates)}\nevent:sync\n\n`);
        
        const newClient = {
            id: docId + docs[docId].num + '',
            res: res
        }

        docs[docId].num++;

        docs[docId].clients.push(newClient);

    }else{
        const newClient = {
            id: docId + '1',
            res: res
        }

        res.write(`id:${docId}\ndata:${JSON.stringify([])}\nevent:sync\n\n`);

        docs[docId] = {
            clients: [newClient],
            num: 2,
            updates: []
        }

        req.on('close', () => {
            docs[docId].clients = docs[docId].clients.filter(client => client.id !== newClient.id);
            docs[docId].num--;
        })
    }

})

app.post('/api/op/:id', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    
    let docId = req.params.id;
    let body = req.body;
    
    
    docs[docId].updates.push(body.update)

    sendUpdates(docId, body);

    res.json({
        status: 200
    })

})

function sendUpdates(docId, body) {
    docs[docId].clients.forEach(client => {
        if (client.id === body.id) {
            return
        }
        const {id, update} = body
        client.res.write(`id:${docId}\ndata:${JSON.stringify(body.update)}\nevent:update\n\n`)
    });
}


server.listen(4000, function(){
    console.log("server is running on port 4000");
})