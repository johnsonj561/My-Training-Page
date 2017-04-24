var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'xxx';

module.exports = function(app, passport){

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(session({ secret: 'xxx', resave: false, saveUninitialized: true, cookies: { secure: false }}));

  passport.serializeUser(function(user, done) {
    // if user has activated account, assign token
    if(user.active) {
      token = jwt.sign({ username: user.username, email: user.email }, secret, {expiresIn: '1h'});
    }
    else {
      token='inactive/error'
    }
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  /*
  * FacebookStrategy with Passport
  */
  passport.use(
    new FacebookStrategy(
      {
        clientID: 'xxx',
        clientSecret: 'xxx',
        callbackURL: "xxx",
        profileFields: ['id', 'displayName', 'email']
      },
      function(accessToken, refreshToken, profile, done) {
        console.log(profile._json.email);
        User.findOne({ email: profile._json.email }).select('username active password email').exec(function(err, user) {
          if(err) done(err);

          if(user && user!= null) {
            done(null, user);  
          }
          else {
            done(err);
          }
        });
      }
    ));

  /*
  * GoogleStategy with Passport
  */
  passport.use(new GoogleStrategy({
    clientID: 'xxx',
    clientSecret: 'xxx',
    callbackURL: "xxx"
  },
                                  function(accessToken, refreshToken, profile, done) {
    console.log(profile._json.email);
    User.findOne({ email: profile.emails[0].value }).select('username active password email').exec(function(err, user) {
      if(err) done(err);
      if(user && user!= null) {
        done(null, user);  
      }
      else {
        done(err);
      }
    });
  }
                                 ));

  
  app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/googleerror/' }), function(req, res) {
    res.redirect('/google/' + token);
  });

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/facebookerror' }), function(req, res){
    res.redirect('/facebook/' + token);

  });

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

  return passport;

};