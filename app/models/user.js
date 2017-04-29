var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');

/*
* mongoose-validator middleware
* https://github.com/leepowellcouk/mongoose-validator
*/
var nameValidator = [
  validate({
    validator: 'matches',
    arguments: /^(([a-zA-Z]{3,30})+[ ]{1}([a-zA-Z]{3,30}))$/,
    message: 'Name must be between 3 and 30 characters and cannot contain any special characters or numbers. ' +
    'Be sure to include your first and last name.'
  }),
   validate({
    validator: 'isLength',
    arguments: [3, 30],
    message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];


var emailValidator = [
  validate({
    validator: 'isEmail',
    message: 'Please provide valid e-mail address'
  }),
  validate({
    validator: 'isLength',
    arguments: [3, 40],
    message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];


var usernameValidator = [
  validate({
    validator: 'isLength',
    arguments: [3, 30],
    message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters'
  }),
  validate({
    validator: 'isAlphanumeric',
    message:'Username must contain letters and numbers only'
  })
];

var passwordValidator = [
  validate({
    validator: 'matches',
    arguments: /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\W]).{8,35}$/,
    message: 'Password must include 1 lowercase, 1 uppercase, 1 number, and 1 symbol.'
  }),
   validate({
    validator: 'isLength',
    arguments: [8, 35],
    message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
  })
];

var scoreValidator = [
  validate({
    validator: 'isNumeric',
    message: 'Training Module score must be numeric'
  })
];


/*
* User schema
*/
var UserSchema = new Schema({
  name: { type: String, required: true, validate: nameValidator },
  username: {type: String, lowercase: true, required: true, unique: true, validate: usernameValidator},
  email: {type: String, required: true, lowercase: true, unique: true, validate: emailValidator},
  password: {type: String, required: true, validate: passwordValidator, select: false},
  active: {type: Boolean, required: true, default: false },
  permission: {type: String, required: true, default: 'user'},
  temporarytoken: {type: String, required: true },
  resettoken: { type: String, required: false },
  assignments: {type: Array, required: false}
});



/*
* mongoose pre save middleware
* http://mongoosejs.com/docs/middleware.html
* function called prior to saving schema
*/
UserSchema.pre("save", function(next) {
  // get this user object
  var user = this;
  
  if(!user.isModified('password')) {
    return next();   
  }

  // bcrypt-nodejs
  // native JS bcrypt library for NodeJS
  // https://www.npmjs.com/package/bcrypt-nodejs
  // hash(data, salt, progress, cb)
  bcrypt.hash(user.password, null, null, function(err, hash) {
    if(err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

// mongoose-title-case plugin will force capitalization of 1st letter, lowercase of remaining chars
// https://www.npmjs.com/package/mongoose-title-case
// Attach some mongoose hooks 
UserSchema.plugin(titlize, {
  paths: ['name'] // Array of paths 
});


UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};


module.exports = mongoose.model('User', UserSchema);