var express = require('express');
var http = require('http');
const fs = require("fs");
var app = express();

require('events').EventEmitter.defaultMaxListeners = 200;

const cors = require('cors');
app.use(cors({credentials: true, origin: true}));

const { Client } = require('@elastic/elasticsearch');

var client = new Client({
    node: 'https://209.151.152.235:9200',
    auth: {
        username: 'elastic',
        password: "W063lUQqlIeVFeaR1SOc"
    },
    tls: {
        ca: fs.readFileSync('/root/index/http_ca.crt'),
        rejectUnauthorized: false
      }
});

app.use(express.urlencoded({extended: true}));
app.use(express.json());

var existWords = {}

app.get('/index/search', async (req, res) => {
    try {
        let query = req.query.q

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
                        fragment_size: 50,
                        number_of_fragments: 5
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
                snippet: hits[i]["highlight"]["content"].join(' ')
            })
        }

        res.status(200).json(response)
    } catch (error) {
        console.log(error)
    }
})

app.get('/index/suggest', async (req, res) => {

    try {
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
            response.push(options[i]["text"])
        }
        res.status(200).json(response)
    } catch (error) {
        console.log(error)
    }

})


var server = http.createServer(app);

server.listen(3000, function(){
    console.log("server is running on port 3000");
})