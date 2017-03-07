var env = process.env.NODE_ENV || 'development'; // to override the running environment setting use grunt --environment <environment/>
var config = require('./config/config')(env),
    glob = require('glob'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    nodemailer = require('nodemailer'),
    events = require('events'),
    serverEmitter = new events.EventEmitter();

//configure mongo - we should move this to config/mongo.js and parameterize it with config

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model)(serverEmitter);
});

passport = require('./config/passport')(mongoose, config);
var app = require('./config/express')(passport, mongoose, config);


var smtpConfig = {
  host: config.SmtpServer,
  port: config.SmtpPort,
  secure: false, // use SSL
  auth: {
    user: config.SMTPUsername,
    pass: config.SMTPPassword
  }
};
app.smtpTransport = nodemailer.createTransport(smtpConfig);

app.smtpTransport.verify(function(error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log('email client is ready to take our messages');
  }
});

//Starting Server
var http = require('http').Server(app);
http.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});

var io = require('socket.io')(http);
io.use(function(socket, next) {
    app.sessionMiddleware(socket.request, socket.request.res, next);
});

// Handle socket notification operation.
io.on('connection',function(socket){
  var userId = 'dummy';
  if(socket.request.session.passport)
    userId = socket.request.session.passport.user;
  
  console.log('We have user connected ! ' + userId);
  //console.log(io.sockets);
  io.sockets[userId] = socket.id;
  
  socket.on('disconnect', function() { 
    serverEmitter.removeListener('newNotification', newNotificationEvent);
    console.log(socket.id + ' disconnected');
  });
  
  console.log('events going to add for ' + socket.id);
    
  newNotificationEvent = function (notification) {
    var hostname = socket.handshake.headers.host;
    var protocol = 'http'; //we should porbably keep the protocol in config/config.js
    
    var data = {}
    data.img = protocol + '://' + hostname + '/img/populo-logo.png';
    data.id = notification._id;
    data.title = notification.title;
    data.details = notification.text;
    data.href = protocol + '://' + hostname + notification.url;
    data.dateTime = notification.created_at;
    // TODO: Replace with actual user image
    data.userImg = protocol + '://' + hostname + '/img/populo-logo.png';
    
    var notifierId = notification.notifierId;
    var initiatorId = notification.type.initiatorId;
    
    var sock_id = io.sockets[notifierId.toString()];
    if(io.sockets.sockets[sock_id]) {
      console.log('Event emited from server! sockid: ' + sock_id + ' userid: ' + notifierId.toString());
      io.sockets.sockets[sock_id].emit("newNotification", data);
    }
  }
  
  serverEmitter.on('newNotification', newNotificationEvent);
});
