var express = require('express');
var http = require('http');
const cors = require('cors');

const session = require('express-session')
const mongoDBSession = require('connect-mongodb-session')(session)
const store = new mongoDBSession({
    uri: process.env.DB_CONNECT,
    collection: 'sessions'
})

const cookieParser = require('cookie-parser')

var app = express();
var server = http.createServer(app);

const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use(cors({credentials: true, origin: true}));
app.use(express.static('build', {
    setHeaders: function(res, path) {
      res.set("X-CSE356", "6339f8feca6faf39d6089077");
    }
}));
app.use('/edit/:id', express.static('build', {
    setHeaders: function(res, path) {
      res.set("X-CSE356", "6339f8feca6faf39d6089077");
    }
}))
app.use('/home', express.static('build', {
    setHeaders: function(res, path) {
      res.set("X-CSE356", "6339f8feca6faf39d6089077");
    }
}))
//app.use(express.static('build'));

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

const router = require('./routes/index')
app.use('/', router)


server.listen(4000, function(){
    console.log("server is running on port 4000");
})