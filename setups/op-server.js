var express = require('express');
var http = require('http');
const cors = require('cors');
var path = require('path')
var app = express();
require('events').EventEmitter.defaultMaxListeners = 200;
const fs = require("fs");
const Document = require('./models/document-model.js')

const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();

const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

const session = require('express-session')
const mongoDBStore = require('connect-mongodb-session')(session)
const store = new mongoDBStore({
    uri: process.env.DB_CONNECT,
    collection: 'sessions'
})


const cookieParser = require('cookie-parser')

app.use(cors({credentials: true, origin: true}));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(cookieParser())

app.use(
  session({
      secret: "session key",
      resave: false,
      store: store,
      saveUninitialized: false,
      proxy:true,
      cookie: {
        httpOnly: true, 
        secure: false, 
        maxAge: 1000 * 60 * 60 * 48, 
        sameSite: false,
      }
  })
)
app.set('trust proxy', 1);

const auth = (req, res, next) => {
	res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
	if (req.session.user){
		next()
	}else{
		return res
			.status(200)
			.json({
				error: true,
				message: 'unauthorized'
			})
	}
}

const Y = require('yjs')
const { Client } = require('@elastic/elasticsearch');

var client = new Client({
    node: 'https://209.151.152.235:9200',
    auth: {
        username: 'elastic',
        password: "W063lUQqlIeVFeaR1SOc"
    },
    tls: {
        ca: fs.readFileSync('/root/google-doc-clone/http_ca.crt'),
        rejectUnauthorized: false
      }
  });

var existWords = {}
var docData = {}

app.get('/api/connect/:id', auth, (req, res) => {
    res.statusCode = 200;
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    res.flushHeaders();
    
    let id = req.params.id;
	const newClient = {
		res: res,
		id: req.session.user,
		name: req.session.name,
		cursor: {
			index: null,
			length: null
		}
	}

    if (docData.hasOwnProperty(id)){
		let newDoc = Array.from(Y.encodeStateAsUpdate(docData[id].doc))
		
		res.write(`id:${id}\ndata:${JSON.stringify({update: newDoc})}\nevent:sync\n\n`);
		docData[id].clients.push(newClient)
		docData[id].clients.forEach(client => {
			res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {index: client.cursor.index, length: client.cursor.length}, id: client.name})}\nevent:presence\n\n`);
		})
    }else {
        Document.findById(id, (err, doc) => {
            if (err || doc === null) return res.end()
            docData[doc._id] = {
                clients: [],
                doc: new Y.Doc(),
                queue: false,
                name: doc.name
            }
            Y.applyUpdate(docData[doc._id].doc, new Uint8Array(doc.yjs))
            res.write(`id:${id}\ndata:${JSON.stringify({update: doc.yjs})}\nevent:sync\n\n`);
            docData[id].clients.push(newClient)
            docData[id].clients.forEach(client => {
                res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {index: client.cursor.index, length: client.cursor.length, id: client.name}})}\nevent:presence\n\n`);
            })
            docData[doc._id].doc.on('update', (update) => {
				update = Array.from(update)
				docData[doc._id].clients.forEach(client => {
					client.res.write(`id:${doc._id}\ndata:${JSON.stringify({update: update})}\nevent:update\n\n`)
				});
			})
        })
    }
    req.on('close', () => {
        if (docData[id] && docData[id].clients){
            docData[id].clients = docData[id].clients.filter(client => client.id !== req.session.id);
        docData[id].clients.forEach(client => {
            client.res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {}, id: req.session.name})}\nevent:presence\n\n`);
        })
        }
        res.end()
    })
})

app.post('/api/op/:id', auth, (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');

	let docId = req.params.id;
	const {update} = req.body;


	res.json({
		status: 200
	})
	Y.applyUpdate(docData[docId].doc, new Uint8Array(update))
	docData[docId].queue = true;
})

updateQueue = async () => {
  for (const id in docData){
      if (docData.hasOwnProperty(id)) {
          if (docData[id].queue === true){
              docData[id].queue = false;
              let json = docData[id].doc.getText('quill').toJSON()
              await client.index({
                  index: 'yjs',
                  id: id,
                  refresh: true,
                  document: {
                      name: docData[id].name,
                      content: json
                  }
              })
              bulkUpdate(json)
          }
      }
  }
}

bulkUpdate = async (json) => {
  let words = json.match(/\b(\w+)\b/g)
  let bulk = []

  for (const word in words){
      let lower = words[word].toLowerCase()
      if (existWords.hasOwnProperty(lower)){
          continue
      }
      existWords[lower] = 1
      bulk.push({
          suggest: lower,
      })
  }
  const result = await client.helpers.bulk({
      datasource: bulk,
      onDocument (doc) {
          return {
            index: { _index: 'yjs-suggest' },
            refresh: true,
          }
        }
  })
}

setInterval(updateQueue, 1000);


var server = http.createServer(app);

server.listen(3000, function(){
    console.log("server is running on port 3000");
})