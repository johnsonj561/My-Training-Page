var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();
var dotenv = require('dotenv').config();
var appRoutes = require('./app/routes/api')(router, dotenv);
var path = require('path');
var passport = require('passport');
var social = require('./app/passport/passport')(app, passport, dotenv);


/*
 * MIDDLEWARE
 */
/*
 * morgan
 * http request logger middleware for node.js
 * writes to console
 * https://www.npmjs.com/package/morgan
 */
app.use(morgan('dev'));

/*
 * body-parser
 * Parse incoming request bodies in a middleware before your handlers, 
 * available under the req.body property.
 * https://www.npmjs.com/package/body-parser
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

/*
 * express.static(root, [options]
 * http://expressjs.com/en/api.html
 * Serves static files at the given location, gives front end access
 */
app.use(express.static(__dirname + '/public'));

// force redirecto to http://www.
app.use(function (req, res, next) {
	console.log(req.headers.host);
	console.log(req.url);
	// 52\.89\.200\.83.*
	if (req.headers.host.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/i)) {
		console.log('regex match');
		res.redirect(301, 'http://' + process.env.HOST + ':3000' + req.url);
	}
	next();
});


/*
 * Must access routes after they've been parsed
 * Order of middleware is important
 */
app.use('/api', appRoutes);


/*
 * mongoose
 * http://mongoosejs.com/index.html
 */
var uri = process.env.DB_HOST;
var options = {
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
}
mongoose.connect(uri, options, function (err) {
	if (err) {
		console.log("Not connected to the database: " + err);
	} else {
		console.log("Successfully connected to MongoDB");
	}
});


app.get('*', function (req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});



app.listen(port, function () {
	console.log("Running on " + port);
});
