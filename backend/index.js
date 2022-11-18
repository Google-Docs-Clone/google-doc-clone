var express = require('express');
var http = require('http');
const cors = require('cors');

const session = require('express-session')
const mongoDBSession = require('connect-mongodb-session')(session)
const store = new mongoDBSession({
    uri: process.env.DB_CONNECT,
    collection: 'sessions'
})
const auth = (req, res, next) => {
  res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
  //console.log(req)
  console.log(req.session)
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

const cookieParser = require('cookie-parser')

var app = express();
var server = http.createServer(app);

const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.use(cors({credentials: true, origin: true}));
//app.use(express.static('build'));

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

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

const router = require('./routes/index')

// app.use(expressWinston.logger({
//   transports: [
//     new winston.transports.Console()
//   ],
//   format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.json()
//   ),
// }));

app.use('/', router)

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
app.use('/register', express.static('build', {
  setHeaders: function(res, path) {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
  }
}))

// app.use(expressWinston.logger({
//   transports: [
//     new winston.transports.Console()
//   ],
//   format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.json()
//   )
// }));

server.listen(4000, function(){
    console.log("server is running on port 4000");
})