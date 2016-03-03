var path = require('path');
var Express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var User = require('./models/user');
var Auth = require('./classes/auth');
var Config = require('../config/app');
var ConvManager = require('./classes/conversation_manager');
var Logger = require('winston');
var ws = require('ws');
//var http = require('http');

var EventEmitter = require("events").EventEmitter;
//var emitter = new EventEmitter();

var WebSocketServer  = ws.Server;
var server;
var app = Express();
var auth = new Auth();
var clientsWithId = {};

app.use(bodyParser.json());

mongoose.connect(Config.DB.mongodbURL);

function rest(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
}

function requireToken (req, res, next) {
  if (req.headers['x-access-token']) {
    auth.getUserByToken(req.headers['x-access-token'], function (ret) {
      if (ret.err) {
        // TODO: consider doing something different if expired?
        return res.sendStatus(401);
      } else {
        req.currentUser = ret.user;
        rest(req, res, next);
      }
    });
  } else {
    // fail, no token
    res.sendStatus(401);
  }
}

app.get(['/', '/login', '/signup'], (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

server = app.listen(process.env.PORT || 3000, () => {
  var port = server.address().port;
  Logger.info('Server is listening at %s', port);
});

var wss = new WebSocketServer({server: server})
wss.on("connection", function(ws) {
  
  var currentUser, convManager;
  var userLogin = function (user) {
    currentUser = user;
    convManager = new ConvManager(currentUser);
    clientsWithId[currentUser.username] = ws;
  };
  
  
  Logger.info("websocket peer connected");
  ws.on("message", function(event) {
    var data = JSON.parse(event);
    Logger.info("onmessage: token=" + data.token);
    Logger.info("onmessage: action=" + data.action);
    var sendFail = function (response) {
      ws.send(JSON.stringify({
        action: data.action,
        data: {
          err: 1,
          response: response || null
        }
      }));
    };
    var sendSuccess = function (response) {
      ws.send(JSON.stringify({
        action: data.action,
        data: {
          err: 0,
          response: response || null
        }
      }));
    };
    if (data.action == 'register') {
        auth.register({
          username: req.body.username,
          email: req.body.email,
          name: req.body.name,
          password: req.body.password
        }, function (ret) {
          if (ret.err) {
            sendFail();
          } else {
            userLogin(ret.response.user);
            sendSuccess();
          }
        });
    }
    // On handshake, we identify the player and send active games back
    else if (data.action == 'handshake') {
      auth.getUserByToken(data.token, function (ret) {
        if (ret.err) {
          // This means the token is not valid or expired
          // Require login
          sendFail({msg: "requireLogin"});
        } else {
          userLogin(ret.response.user);
          sendSuccess();
        }
      });
    } else if (convManager) {
      // For all other calls, gameMananger will take care
      convManager.doAction(data.action, data.data, function (res) {
        var ret = {
          action: data.action,
          data: res
        };
        Logger.info("send", JSON.stringify(ret));
        
      });
    }
  });
  // Close connection and remove from array
  ws.on("close", function() {
    Logger.info("websocket peer closed username=" + currentUser.username);
    clientsWithId[currentUser.username]= null;
  })
});