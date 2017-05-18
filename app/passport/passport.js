var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');

module.exports = function (app, passport, dotenv) {
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(session({
		secret: process.env.PASSPORT_SECRET,
		resave: false,
		saveUninitialized: true,
		cookies: {
			secure: false
		}
	}));

	passport.serializeUser(function (user, done) {
		// if user has activated account, assign token
		if (user.active) {
			token = jwt.sign({
				username: user.username,
				email: user.email
			}, process.env.SECRET, {
				expiresIn: '1h'
			});
		} else {
			token = 'inactive/error'
		}
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	/*
	 * FacebookStrategy with Passport
	 */
	passport.use(
		new FacebookStrategy({

				clientID: process.env.FACEBOOK_ID,
				clientSecret: process.env.FACEBOOK_SECRET,
				callbackURL: process.env.HOST + '/auth/facebook/callback',
				profileFields: ['id', 'displayName', 'email']
			},
			function (accessToken, refreshToken, profile, done) {
				console.log(profile._json.email);
				User.findOne({
					email: profile._json.email
				}).select('username active password email').exec(function (err, user) {
					if (err) done(err);

					if (user && user != null) {
						done(null, user);
					} else {
						done(err);
					}
				});
			}
		));

	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		failureRedirect: '/facebookerror'
	}), function (req, res) {
		res.redirect('/facebook/' + token);

	});

	app.get('/auth/facebook', passport.authenticate('facebook', {
		scope: 'email'
	}));

	return passport;

};
