const express = require('express');
const app = express();
const port = 8000;
const viewRouters = require('./routes/viewRouters');
const loginRoutes = require('./routes/loginRoutes');
const supplementRoutes = require('./routes/supplementsRoutes');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); //warning The default server-side session storage, MemoryStore, is purposely not designed for a production environment.
                                            //compatible session stores https://github.com/expressjs/session#compatible-session-stores
const qr = require('./routes/qrCodeRoutes');
const srvUtils = require('./utils/serverUtils.js');
const basic = require('./basicFunctions');
const timeout = require('connect-timeout');
const cookieParser = require('cookie-parser')

// view engine setup
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'pug');

//middlewares
app.use(express.static('public'));
// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());
app.use(session({
  name: 'clientAppCookie',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
})); //set up middleware for session handling

app.use(timeout(120000));

app.use('/',loginRoutes);
app.use('/login',loginRoutes);
app.use('/supplement',supplementRoutes);
app.use('/qr',qr);

app.use(haltOnTimedout);//the following timeout middleware has to be the last middleware


//start the server
const server = app.listen(port,"127.0.0.1", (err,res) => {
  if(err){
    console.log("error!!", err);
  }else{
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
    console.log("server started");
    //initialize the blocokchain configuration
    srvUtils.address = host;
    srvUtils.port = port;
    // console.log(srvUtils.address);
    basic.init();
  }
});


// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
})


function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}
