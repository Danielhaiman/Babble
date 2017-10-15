var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



var messagesBlClass = require('./messages-util.js')

var app = express();
console.log("Server up!");

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

console.log(path.join(__dirname, '../client'));
app.use(express.static(path.join(__dirname, '../client')));

//make it accessible from the routes
app.set('messagesBl', messagesBlClass);


//initialize the endpoint routers

app.get('/messages', getMessages);
app.post('/messages', sendMessage);
app.delete('/messages/:id', deleteMessage);
app.all('/messages', send405);

app.get('/stats', getStats);
app.all('/stats', send405);


//catch 405 errors and forward to error handler
function send405(req, res, next) {
    var err = new Error('Method Not Allowed');
    err.status = 405;
    next(err)
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.status);
});

var express = require('express');
var router = express.Router();
var http = require('http');

//stats area

function getStats (req, res, next) {
    //send stats

    //get the actual messages object
    var messageBl = req.app.get('messagesBl');

    var statsObject = {
        "totalMessageCount": messageBl.getTotalNumberOfMessages(),
        "totalNumberOfConnectedUsers": messageBl.getTotalNumberOfConnectedUsers()
    };

    res.json(statsObject).send();
};


//messages area

function getMessages(req, res, next) {

    //validate the input of the call
    if (!(validateInput(req)))
    {
        res.status(400).send().end();
        return;
    }

    //get the counter of the message starting from which to return
    var counter = req.query.counter;

    //get the actual messages object
    var messageBl = req.app.get('messagesBl');

    //first check whether there are messages to get
    var newMessagesAvailable = messageBl.areNewMessagesAvailable(counter);

    if (newMessagesAvailable) {
        //get the messages
        var response = messageBl.getMessages(counter);

        //return the response
        res.json(response).send().end();

    } else {
        messageBl.saveClientForLater(counter, res);
    }

    };

function sendMessage(req, res, next) {

    //get the body of the request
    var body = req.body;

    //get the actual messages object
    var messageBl = req.app.get('messagesBl');

    //store the message object and return it's ID
    var response = messageBl.addMessage(body);

    //before respoding, release all pending clients
    messageBl.releaseAllPendingClients();

    //return the response
    res.json(response).send().end();
};

function deleteMessage(req, res, next) {

    //validate the input of the call
    validateInput(req);

    //get the counter of the message to delete
    var counter = req.params.id

    //get the actual messages object
    var messageBl = req.app.get('messagesBl');

    //delete the messages
    messageBl.deleteMessage(counter);

    //return 200 (if we are here, everything is most likely fine)
    res.status(200).send().end();
};



function validateInput(req, res) {
    //check that the request contains the variable: "counter"
    //check that the value is numeric
    //return HTTP error code 400 in case these checks fail

    var counterVariable = req.query.counter;
    return (((typeof counterVariable != 'undefined')) && (!(isNaN(counterVariable))));
}


module.exports = app;