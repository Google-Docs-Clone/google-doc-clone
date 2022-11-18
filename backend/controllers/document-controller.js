const Document = require('../models/document-model.js')
const path = require("path");
const fs = require("fs");
const Y = require('yjs')
const { Client } = require('@elastic/elasticsearch');

var client = new Client({
    node: 'https://localhost:9200',
    auth: {
        username: 'elastic',
        password: "GbEZGe27sOAwnV2_=B5k"
    },
    tls: {
        ca: fs.readFileSync('./http_ca.crt'),
        rejectUnauthorized: false
      }
  });

var existWords = {}
/*
id: {
    clients: [
        {
            res: res,
            cursor:{index, length},
            id: email
        }  
    ],
    doc: Object //full doc
    queue: [] // updates
}
*/
var docData = {}

const handleError = (res, error) => {
    res
    .status(200)
    .json({
        error: true,
        message: error
    })
}

createDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
    const {name} = req.body

    if (!name){ return handleError(res, 'invalid name') }

    const newDocument = new Document({
        name: name,
        yjs: [0,0]
    })

    const savedDocument = await newDocument.save()

    docData[savedDocument._id] = {
        clients: [],
        doc: new Y.Doc(),
        queue: [],
        name: name
    }

    await client.index({
        index: 'yjs',
        id: savedDocument._id.toString(),
        document: {
            name: savedDocument.name,
            content: ""
        }
    }).catch(console.log)

    return res
            .status(200)
            .json({
                id: savedDocument._id
            })
}

deleteDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
    const {id} = req.body

    if (!id) { return handleError(res, 'invalid id for deletion') }

    docData[id].clients.forEach(client => {
        client.res.end()
    })
    delete docData[id]

    await Document.findByIdAndDelete(id)

    await client.indices.delete({
        index: "yjs",
        id: id
    })

    return res
            .status(200)
            .json({
                status: 'OK'
            })
}

listDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");

    updateQueue()

    const docs = await Document.find().sort({ createdAt: -1 }).limit(10)
    let latestTen = []
    for (const doc in docs) {  
        latestTen.push({
            id: docs[doc]._id,
            name: docs[doc].name
        })
    }
    latestTen.reverse()

    return res
            .status(200)
            .json(latestTen)
} 

connect = async (req, res) => {
    res.statusCode = 200;
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    res.flushHeaders();
    
    let id = req.params.id;

    if (docData.hasOwnProperty(id)){
        const newClient = {
            res: res,
            id: req.session.user,
            name: req.session.name,
            cursor: {
                index: null,
                length: null
            }
        }

        if (docData[id].queue.length > 0){
            let queue = docData[id].queue
            let updates = Y.mergeUpdates(queue)
            Y.applyUpdate(docData[id].doc, updates)
            docData[id].queue = []
        }
        
        let newDoc = Array.from(Y.encodeStateAsUpdate(docData[id].doc))

        
        res.write(`id:${id}\ndata:${JSON.stringify({update: newDoc})}\nevent:sync\n\n`);
        docData[id].clients.push(newClient)
        docData[id].clients.forEach(client => {
            res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {index: client.cursor.index, length: client.cursor.length}, id: client.name})}\nevent:presence\n\n`);
        })
        Document.findOne({_id: id}, (err, doc) => {
            doc.yjs = Array.from(newDoc)
            doc.save().then(() => {
                //console.log('success')
            }).catch(error => {
                console.log(error)
            })
            let json = docData[id].doc.getText('quill').toJSON()
            client.index({
                index: 'yjs',
                id: id,
                refresh:true,
                document: {
                    name: docData[id].name,
                    content: json
                }
            }).then(res => {
                //console.log(res)
            })
            bulkUpdate(json)
        })

    }else {
        Document.findById(id, (err, doc) => {
            if (err || doc === null) return res.end()
            const newClient = {
                res: res,
                id: req.session.user,
                name: req.session.name,
                cursor: {
                    index: null,
                    length: null
                }
            }
            docData[doc._id] = {
                clients: [],
                doc: new Y.Doc(),
                queue: [],
                name: doc.name
            }
            Y.applyUpdate(docData[doc._id].doc, new Uint8Array(doc.yjs))
            res.write(`id:${id}\ndata:${JSON.stringify({update: doc.yjs})}\nevent:sync\n\n`);
            docData[id].clients.push(newClient)
            docData[id].clients.forEach(client => {
                res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {index: client.cursor.index, length: client.cursor.length, id: client.name}})}\nevent:presence\n\n`);
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
}

update = async (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');

    let docId = req.params.id;
    const {update} = req.body;

    docData[docId].queue.push(new Uint8Array(update) )

    docData[docId].clients.forEach(client => {
        client.res.write(`id:${docId}\ndata:${JSON.stringify({update: update})}\nevent:update\n\n`)
    });

    res.json({
        status: 200
    })

    if (docData[docId].queue.length > 0){
        let queue = docData[docId].queue
        let updates = Y.mergeUpdates(queue)
        Y.applyUpdate(docData[docId].doc, updates)
        let newDoc = Y.encodeStateAsUpdate(docData[docId].doc)
        Document.findOne({_id: docId}, (err, doc) => {
            doc.yjs = Array.from(newDoc)
            doc.save().then(() => {
                //console.log('success')
            }).catch(error => {
                console.log(error)
            })
        })
        docData[docId].queue = []
        let json = docData[docId].doc.getText('quill').toJSON()
        await client.index({
            index: 'yjs',
            id: docId,
            refresh:true,
            document: {
                name: docData[docId].name,
                content: json
            }
        })
        bulkUpdate(json)
    }
}

fileUpload = (req, res) => {
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    const tempPath = req.file.path;

    let ext = path.extname(req.file.originalname).toLowerCase()
    let id = tempPath.slice(6)

    const newPath = 'media/' + id + ext
    

    if (ext === ".png" || ext === ".jpeg" || ext === '.gif') {
        fs.rename(tempPath, newPath, (err) => {
            if (err) return handleError(res, err)
            res 
            .status(200)
            .json({
                mediaid: id + ext
            })
        })
        
    }else {
        fs.unlink(tempPath, err => {
            if (err) return handleError(res, err)

            handleError(res, 'invalid file')
        })
    }
}

fileDownload = (req, res) => {
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    let mime = path.extname(req.params.mediaid).slice(1)
    fs.readFile('media/'+ req.params.mediaid, function(err, data) {
        if(err) {
            handleError(res, err)
        }else{
            res.setHeader("Content-Type", "image/"+mime)
            res.writeHead(200);
            res.end(data)
        }
    })
}

updatePresence = (req, res) => {
    res.setHeader('X-CSE356', '6339f8feca6faf39d6089077');
    const { index, length } = req.body
    let id = req.params.id

    docData[id].clients.forEach(client => {
        if (client.id === req.session.user){
            client.cursor.index = index
            client.cursor.length = length
        }
        client.res.write(`id:${id}\ndata:${JSON.stringify({session_id: req.session.token, name: req.session.name, cursor: {index: index, length: length}, id: req.session.name})}\nevent:presence\n\n`)
    })
    res.status(200).json({status: "OK"})

}

indexSearch = async (req, res) => {
    updateQueue()
    
    let query = req.query.q
    //console.log(req.query)

    const result = await client.search({
        index: 'yjs',
        size: 10,
        query: {
            match: {
                content: {
                    query: query,
                    analyzer: "search_analyzer",
                }
            }
        },
        highlight: {
            order: "score",
            fields: {
                content: {
                    fragment_size: 70,
                }
            }
        }
    })
    let hits = result.hits.hits
    let response = []
    for (let i=0; i<hits.length; i++){
        response.push({
            docid: hits[i]["_id"],
            name: hits[i]["_source"]["name"],
            snippet: hits[i]["highlight"]["content"][0]
        })
    }
    

    res.status(200).json(response)
    
}

indexSuggest = async (req, res) => {
    updateQueue()
    let query = req.query.q

    const result = await client.search({
        index: "yjs-suggest",
        suggest: {
            autocomplete: {
                prefix: query,
                completion: {
                    field: "suggest"
                }
            }
        }
    })
    
    let response = []

    let options = result.suggest.autocomplete[0].options

    for (let i=0; i<options.length; i++){
        response.push(options[i]["_source"]['suggest'])
    }

    res.status(200).json(response)
}

updateQueue = async () => {
    for (const id in docData){
        if (docData.hasOwnProperty(id)) {
            if (docData[id].queue.length > 0){
                let queue = docData[id].queue
                let updates = Y.mergeUpdates(queue)
                Y.applyUpdate(docData[id].doc, updates)
                let newDoc = Y.encodeStateAsUpdate(docData[id].doc)
                Document.findOne({_id: id}, (err, doc) => {
                    doc.yjs = Array.from(newDoc)
                    doc.save().then(() => {
                        //console.log('success')
                    }).catch(error => {
                        console.log(error)
                    })
                })
                
                docData[id].queue = []
                let json = docData[id].doc.getText('quill').toJSON()
                await client.index({
                    index: 'yjs',
                    id: id,
                    refresh:true,
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
        if(existWords.hasOwnProperty(lower)){
            continue
        }
        existWords[lower] = 1
        bulk.push({
            suggest: lower
        })
    }
    const result = await client.helpers.bulk({
        datasource: bulk,
        onDocument (doc) {
            return {
              index: { _index: 'yjs-suggest' }
            }
          }
    })
}

module.exports = {
    createDocument,
    deleteDocument,
    listDocument,
    update,
    connect,
    fileUpload,
    fileDownload,
    updatePresence,
    indexSearch,
    indexSuggest
}