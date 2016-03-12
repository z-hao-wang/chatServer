var path = require('path');
var Express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var User = require(__dirname + '/models/user');
var Auth = require(__dirname + '/classes/auth');
var Config = require(__dirname + '/../config/app');
var MessageManager = require(__dirname + '/classes/message_manager');
var Logger = require('winston');
var ws = require('ws');
var redis = require('redis');
var EventEmitter = require("events").EventEmitter;

// Setup Redis pub/sub.
// NOTE: You must create two Redis clients, as
// the one that subscribes can't also publish.
var sub = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});
sub.subscribe('global');



var WebSocketServer  = ws.Server;
var server;
var app = Express();
var auth = new Auth();
var clientsWithId = {};

app.use(bodyParser.json());
console.log('Connecting to ' + process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL);

// Listen for messages being published to this server.
sub.on('message', function(channel, dataStr) {
  // Broadcast the message to all connected clients on this server.
  var data = JSON.parse(dataStr);
  console.log('message:data', data);
  if (data && data.recipients) {
    for (var i = 0; i < data.recipients.length; i++) {
      if (clientsWithId[data.recipients[i]]) {
        var ret = JSON.stringify({
          action: data.action,
          data: data.data
        });
        clientsWithId[data.recipients[i]].send(ret);
      }
    }
  }
});

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
  
  var currentUser, messageManager;
  var userLogin = function (user) {
    currentUser = user;
    Logger.info("userLogin", JSON.stringify(currentUser));
    messageManager = new MessageManager(currentUser);
    clientsWithId[currentUser.id] = ws;
  };

  Logger.info("websocket peer connected");
  ws.on("message", function(event) {
    var data = JSON.parse(event);

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
    if (data.action == 'register' || data.action == 'login') {
        auth[data.action]({
          username: data.username,
          password: data.password
        }, function (ret) {
          if (ret.err) {
            sendFail(ret.response);
          } else {
            userLogin(ret.response.user);
            sendSuccess(ret.response);
          }
        });
    } else if (data.action == 'logout') {
      auth[data.action]({
        username: data.username
      });
      // TODO: There is a bug that after logout, the connect still remains active.
      // Maybe consider to close the connection on logout
      if (currentUser) {
        Logger.info("websocket peer closed username=" + currentUser.username);
        clientsWithId[currentUser.id]= null;
      }
    }
    // On handshake, we identify the player and send active games back
    else if (data.action == 'handshake') {
      Logger.info("onmessage: token=" + data.token);
      auth.getUserByToken(data.token, function (ret) {
        if (ret.err) {
          // This means the token is not valid or expired
          // Require login
          sendFail({msg: "requireLogin"});
        } else {
          userLogin(ret.response.user);
          sendSuccess(ret.response);
        }
      });
    } else if (messageManager) {
      Logger.info("info: onmessage: data=" + JSON.stringify(data.data));
      // For all other calls, gameManager will take care
      messageManager.doAction(data.action, data.data, function (res) {
        var ret = {
          action: data.action,
          data: res
        };
        Logger.info("send", JSON.stringify(ret));
        sendSuccess(ret);
        if (data.action == 'newMessage') {
          pub.publish('global', message);
        }
      });
    }
  });
  // Close connection and remove from array
  ws.on("close", function() {
    if (currentUser) {
      Logger.info("websocket peer closed username=" + currentUser.username);
      clientsWithId[currentUser.id]= null;
    }
    Logger.info("websocket peer closed");
  })
});