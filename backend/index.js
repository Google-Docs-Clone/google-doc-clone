var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/api/connect/:id', (req, res) => {
    console.log(req.params.id);
})

app.post('/api/op/:id', (req, res) => {

})


server.listen(4000, function(){
    console.log("server is running on port 4000");
})