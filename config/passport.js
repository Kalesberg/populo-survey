var passport = require('passport'),
    SamlStrategy = require('passport-saml-encrypted').Strategy

module.exports = function(mongoose, config){

  var User = mongoose.model('User');

  if(config.saml.enabled){

    var findByEmail = function(email, callback){
      User.findOne({'email': email}, function (err, user) {
        return callback(err, user);
      });
    };
    
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.
    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });

    passport.deserializeUser(function(id, done) {
        findByEmail(id, function (err, user) {
            done(err, user);
        });
    });

    for(var index = 0; index < config.saml.providers.length; ++index){
      var provider = config.saml.providers[index];
      
      passport.use(new SamlStrategy(
        {
          path: config.saml.path,
          callbackUrl: config.saml.callbackDomain ? config.saml.callbackDomain + config.saml.path : undefined,
          protocol: config.protocol,
          entryPoint: provider.entryPoint,
          issuer: provider.issuer,
          //customBuildAuthorizeRequestCallback:fnAuthRequest,
          //customBuildLogoutRequestCallback:fnLogoutRequest
        }, function(profile, done) {

          if (!profile.email) {
            return done({message: 'The identity provider did not return an email address with your profile. Please contact support.'}, null);
          }

          profile.email = profile.email.toLowerCase();
          // asynchronous verification
          process.nextTick(function () {          
            findByEmail(profile.email, function(err, user) {
              if (err) {
                return done(err);
              }
              
              if (!user) {              
                return done({message:'Unable to find user with email address ' + profile.email + '. Please contact info@populo.co to register.'}, null);
              }
              
              return done(null, user);
            });
            
          });
        }));
    }
  }
  else {

    var bcrypt = require('bcrypt-nodejs'),
    LocalStrategy = require('passport-local').Strategy;
    
    passport.serializeUser(function (user, done) {
      done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
      User.findById(id, function (err, user) {
        done(err, user);
      });
    });

    passport.use('login', new LocalStrategy({
      passReqToCallback: true
    },function (req, username, password, done) {
      // check in mongo if a user with username exists or not
      User.findOne({'full_legal_name': username}, function (err, user) {
        // In case of any error, return using the done method
        if (err)
          return done(err);
        // Username does not exist, log error & redirect back
        if (!user) {
          console.log('User Not Found with username' + username);
          return done(null, false,
                      req.flash('message', 'User Not found.'));
        }

        var isValidPassword = function (user, password) {
          return bcrypt.compareSync(password, user.encrypted_password);
        };

        // User exists but wrong password, log the error
        if (!isValidPassword(user, password)) {
          console.log('Invalid Password');
          return done(null, false,
                      req.flash('message', 'Invalid Password'));
        }
        // User and password both match, return user from
        // done method which will be treated like success
        return done(null, user);
      });
    }));
  }

  return passport;
};
