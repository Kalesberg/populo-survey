var express = require('express'),
    expressSession = require('express-session'),
    path = require('path'),
    glob = require('glob'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    compress = require('compression'),
    methodOverride = require('method-override'),
    flash = require('connect-flash'),
    _ = require("underscore");

module.exports = function (passport, mongoose, config) {

  var app = express();  
  app.locals._ = _;
  
  app.locals.ENV = config.environment;
  app.locals.ENV_DEVELOPMENT = app.locals.ENV == 'development';
  
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');

  app.sessionMiddleware = ''; // this is ugly. I am avoiding doing any further refactoring and the socketio needs the session middleware so we will provide it.
  var secret = 'keyboard cat';

  //Session configurations
  if(app.locals.ENV_DEVELOPMENT){
    //redis was never setup so I removed the configuration.
    app.sessionMiddleware = expressSession({secret: secret});
  }else{
    //This is not good. We are using MemoryStore for production environment. This must be changed.
    //why don't we use one of the mongodb session stores rather than redis since we are already using mongodb?
    app.sessionMiddleware = expressSession({secret: secret});
  }

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  app.use(app.sessionMiddleware);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 100000}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(compress());
  app.use('/files', express.static(path.join(config.root, '/public')));
  app.use(express.static(path.join(config.root, '/public')));
  app.use(methodOverride());

  // Give Views/Layouts direct access to session data.
  app.use(function (req, res, next) {
    res.locals.user = req.user;
    
    if(/\/img/i.test(req.path) || /\/js/i.test(req.path) || /\/css/i.test(req.path) 
       || /\/pdf/i.test(req.path) || /\/avatar/i.test(req.path)) 
      return next();
    
    if (req.user) {
      Notification = mongoose.model('Notification');
      Notification.find({notifierId: req.user._id, popupRead: false}, function (err, notifications) {
        res.locals.notifications_popup = notifications.reverse();
      });
    }
    
    next();
  });


  var controllers = glob.sync(path.join(config.root,'/app/controllers/*.js'));
  controllers.forEach(function (controller) {
    require(controller)(app, config);
  });

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: app.locals.ENV_DEVELOPMENT ? err : {},
      title: 'error'
    });
  });

  return app;
};
