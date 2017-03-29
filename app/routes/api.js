var User = require('../models/user');
var jwt = require('jsonwebtoken');    // json web token for storing session - https://github.com/auth0/node-jsonwebtoken
var secret = 'xxx';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

const AUTH_TOKEN_EXPIRES = '30s';

module.exports = function(router) {


  /*
* Sendgrid email service
* https://sendgrid.com/blog/sending-email-nodemailer-sendgrid/
*/
  var options = {
    auth: {
      api_user: 'xxxx',
      api_key: 'xxx'
    }
  }

  var client = nodemailer.createTransport(sgTransport(options));


  /*
  * REGISTER ROUTE
  * validates new user information and stores in mongodb
  * http://localhost:3000/api/users
  */
  router.post('/users', function(req, res) {
    var user = new User();
    user.username = req.body.username;
    user.password = req.body.password;
    user.email = req.body.email;
    user.name = req.body.name;
    user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, {expiresIn: '24h'});
    if(req.body.username == null || req.body.username == "" || 
       req.body.password == null || req.body.password == "" || 
       req.body.email == null || req.body.email == "" ||
       req.body.name == null || req.body.name == "") {
      res.json({success: false, message: "Ensure username, email, and password were provided"});
    }
    else {
      user.save(function(err) {
        if(err) {

          // if we have received error message from model.user.js validation
          if(err.errors != null) {
            if(err.errors.name) {
              res.json({ success: false, message: err.errors.name.message });
            }
            else if(err.errors.email) {
              res.json({ success: false, message: err.errors.email.message });  
            }
            else if(err.errors.username) {
              res.json({  success: false, message: err.errors.username.message });
            }
            else if(err.errors.password) {
              res.json({ success: false, message: err.errors.password.message });
            }
            else{
              res.json({ success: false, message: err });
            }
          }
          else if(err) {
            if(err.code == 11000) {
              res.json({ success: false, message: "Username or Email already exists." });
            }
            else{
              res.json({ success: false, message: err });
            }
          }
        }
        // else no error, return success
        else{

          var email = {
            from: 'Localhost Staff, staff@localhost.com',
            to: user.email,
            subject: 'Hello From MyTrainingPage',
            text: 'Hello ' + user.name + ', Thank you for registering at localhost.com' +
            ' Please click on the link below to complete your activation: <a href="http://localhost:3000/activate/' 
            + user.temporarytoken,
            html: 'Hello <strong>' + user.name + ',</strong><br><br>Thank you for registering at localhost.com<br>' +
            ' Please click on the link below to complete your activation: <br><br><a href="http://localhost:3000/activate/' 
            + user.temporarytoken + '">' + 'htp://localhost:3000/activate'
          };

          client.sendMail(email, function(err, info){
            if (err ){
              console.log(err);
            }
            else {
              console.log('Message sent: ' + info.response);
            }
          });

          res.json({success: true, message: "Account registered!. Please checkyour e-mail for activation link."});
        }
      });
    }
  });


  /*
  * LOGIN ROUTE
  * validates login info
  * http://localhost:3000/api/authenticate
  */
  router.post('/authenticate', function(req, res) {
    User.findOne({ username: req.body.username }).select('email username password active').exec(function(err, user) {
      if(err) throw err;

      if(!user) {  // bad username provided
        res.json({ success: false, message: 'Could not authenticate user' });
      }

      else if(user) {    // username is valid

        if(req.body.password) {   // password is not empty
          var validPassword = user.comparePassword(req.body.password);
        }
        else {
          res.json({ message: false, message: 'No password provided' });  
        }
        if(!validPassword) {    // password does not match
          res.json({ success: false, message: 'Could not authenticate password' });
        }
        else if(!user.active) {
          res.json({ success: false, message: 'Account is not yet activated. Please check email for activation link.', expired: true });
        }
        else {    // password does match
          // json web token stores session when user logs in
          // expiration 60 * 60 = 1 hour
          var token = jwt.sign({ username: user.username, email: user.email }, 
                               secret, { expiresIn: '5m' });
          res.json({ success: true, message: 'User Authenticated', token: token});
        }
      }
    });
  });

  /*
  * CHECK USERNAME
  * validates username
  */
  router.post('/checkusername', function(req, res) {
    User.findOne({ username: req.body.username }).select('username').exec(function(err, user) {
      if(err) throw err;

      if(user) {
        res.json({ success: false, message: 'That username is already taken' });
      }
      else {
        res.json({ success: true, message: 'Valid username' });
      }
    })
  });

  /*
  * CHECK EMAIL
  * validates email
  */
  router.post('/checkemail', function(req, res) {
    User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
      if(err) throw err;

      if(user) {
        res.json({ success: false, message: 'That email is already taken' });
      }
      else {
        res.json({ success: true, message: 'Valid e-mail' });
      }
    })
  });


  /*
  * ACTIVATION ROUTE
  */
  router.put('/activate/:token', function(req, res) {
    User.findOne({ temporarytoken: req.params.token }, function(err, user) {
      if (err) throw err; // Throw error if cannot login
      var token = req.params.token; // Save the token from URL for verification 

      // Function to verify the user's token
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          res.json({ success: false, message: 'Activation link has expired.' }); // Token is expired
        } else if (!user) {
          res.json({ success: false, message: 'Activation link has expired.' }); // Token may be valid but does not match any user in the database
        } else {
          user.temporarytoken = false; // Remove temporary token
          user.active = true; // Change account status to Activated
          // Mongoose Method to save user into the database
          user.save(function(err) {
            if (err) {
              console.log(err); // If unable to save user, log error info to console/terminal
            } else {
              // If save succeeds, create e-mail object
              var email = {
                from: 'Localhost Staff, staff@localhost.com',
                to: user.email,
                subject: 'Localhost Account Activated',
                text: 'Hello ' + user.name + ', Your account has been successfully activated!',
                html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Your account has been successfully activated!'
              };

              // Send e-mail object to user
              client.sendMail(email, function(err, info) {
                if (err) console.log(err); // If unable to send e-mail, log error info to console/terminal
              });
              res.json({ success: true, message: 'Account activated!' }); // Return success message to controller
            }
          });
        }
      });
    });
  });


  /*
  * RESEND ROUTE
  * validates login info
  * http://localhost:3000/api/authenticate
  */
  // Route to verify user credentials before re-sending a new activation link	
  router.post('/resend', function(req, res) {
    User.findOne({ username: req.body.username }).select('username password active').exec(function(err, user) {
      if (err) throw err; // Throw error if cannot connect

      // Check if username is found in database
      if (!user) {
        res.json({ success: false, message: 'Could not authenticate user' }); // Username does not match username found in database
      } else if (user) {
        // Check if password is sent in request
        if (req.body.password) {
          var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
          if (!validPassword) {
            res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
          } else if (user.active) {
            res.json({ success: false, message: 'Account is already activated.' }); // Account is already activated
          } else {
            res.json({ success: true, user: user });
          }
        } else {
          res.json({ success: false, message: 'No password provided' }); // No password was provided
        }
      }
    });
  });

  // Route to send user a new activation link once credentials have been verified
  router.put('/resend', function(req, res) {
    User.findOne({ username: req.body.username }).select('username name email temporarytoken').exec(function(err, user) {
      if (err) throw err; // Throw error if cannot connect
      user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Give the user a new token to reset password
      // Save user's new token to the database
      user.save(function(err) {
        if (err) {
          console.log(err); // If error saving user, log it to console/terminal
        } else {
          // If user successfully saved to database, create e-mail object
          var email = {
            from: 'Localhost Staff, staff@localhost.com',
            to: user.email,
            subject: 'Localhost Activation Link Request',
            text: 'Hello ' + user.name + ', You recently requested a new account activation link. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
            html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="http://localhost:3000/activate/' + user.temporarytoken + '">http://localhost:3000/activate/</a>'
          };

          // Function to send e-mail to user
          client.sendMail(email, function(err, info) {
            if (err) console.log(err); // If error in sending e-mail, log to console/terminal
          });
          res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!' }); // Return success message to controller
        }
      });
    });
  });


  router.get('/resetusername/:email', function(req, res) {
    User.findOne({ email: req.params.email }).select().exec(function(err, user) {
      if(err) {
        res.json({ success: false, message: err });
      }
      else {
        if(!req.params.email) {
          res.json({ success: false, message: 'No e-mail was provided' });  
        }
        else {

          if(!user) {
            res.json({ success: false, message: 'Email was not found' });  
          }
          else { 
            var email = {
              from: 'Localhost Staff, staff@localhost.com',
              to: user.email,
              subject: 'Localhost Username Request',
              text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files for future use: ' +
              user.username,
              html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' +
              user.username
            };

            client.sendMail(email, function(err, info) {
              if(err) {
                console.log(err);
              }
            });
            res.json({ success: true, message: 'Username has been sent to e-mail ' });
          }
        }
      }
    });
  });


  router.put('/resetpassword', function(req, res) {
    User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user) {
      if(err) throw err;
      if(!user) {
        res.json({ success: false, message: 'Username was not found' });
      }
      else if(!user.active) {
        res.json({ success: false, message: 'Account not yet activated' });
      }
      else {
        user.resettoken = jwt.sign({ username: user.username, email: user.email }, secret, {expiresIn: '24h'});
        user.save(function(err) {
          if(err) {
            res.json({ success: false, message: err });
          }
          else {
            var email = {
              from: 'Localhost Staff, staff@localhost.com',
              to: user.email,
              subject: 'Localhost Reset Password',
              text: 'You have requested a reset password link. Please click on the link to reset your password: ' +
              '<a href="http://localhost:30000/activate/' + user.resettoken + '">http://localhost:3000/activate/</a>',
              html: 'Hi ' + user.name + ', you have requested a reset password ink. Please click on the link to reset your password:<br>' +
              '<a href="http://localhost:3000/activate/' + user.resettoken +'">Reset Password</a>'
            };

            client.sendMail(email, function(err, info){
              if (err ){
                console.log(err);
              }
              else {
                console.log('Message sent: ' + info.response);
              }
            });
            res.json({ success: true, message: 'Please check your e-mail for password reset linkk' });
          }
        });
      }
    });
  });


  router.get('/resetpassword/:token', function(req, res) {
    User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
      if(err) throw err;
      var token = req.params.token;
      jwt.verify(token, secret, function(err, decoded) {
        if(err) {
          res.json({success: false, message: 'Password link has expired'});
        }
        else{
          if(!user) {
            res.json({ success: false, message: 'Password link has expired' });
          }
          else{
            res.json({ success: true, user: user });
          }
        }
      });  
    });  
  });


  router.put('/savepassword', function(req, res) {
    User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function(err, user) {
      if(err) throw err;
      if(req.body.password == null || req.body.password == '') {
        res.json({ success: false, message: 'Password not provided' }); 
      }
      else {
        user.password = req.body.password;
        user.resettoken = false;
        user.save(function(err) {
          if(err) {
            res.json({ success: false, message: err });
          }
          else {
            var email = {
              from: 'Localhost Staff, staff@localhost.com',
              to: user.email,
              subject: 'Localhost Password Reset',
              text: 'This email if to notify you that your password has been recently reset.',
              html: 'Hi ' + user.name + ', your password has been reset.'
            };
            client.sendMail(email, function(err, info){
              if (err ){
                console.log(err);
              }
              else {
                console.log('Message sent: ' + info.response);
              }
            });
            res.json({ success: true, message: 'Password has been reset!' });  
          }
        });
      }
    });

  });  



  /* MIDDLEWARE */

  router.use(function(req, res, next) {
    var token = req.body.token || req.body.query || req.headers['x-access-token'];
    if(token) {
      jwt.verify(token, secret, function(err, decoded) {
        if(err) {
          res.json({success: false, message: 'Token invalid'});
        }
        else{
          req.decoded = decoded;  
          next();
        }
      });
    }
    else {
      res.json({success: false, message: 'No token provided'}); 
    }
  });


  router.post('/me', function(req, res) {
    res.send(req.decoded);
  });

  router.get('/renewToken/:username', function(req, res) {
    User.findOne({ username: req.params.username }).select().exec(function(err, user) {
      if(err) throw err;
      if(!user) {
        res.json({ success: false, message: 'No user was found' }); 
      }
      else {
        var newToken = jwt.sign({ username: user.username, email: user.email }, secret, {expiresIn: '24h' });
        res.json({ success: true, token: newToken });
      }
    });  

  });


  router.get('/permission', function(req, res) {
    User.findOne({ username: req.decoded.username }, function(err, user) {
      if(err) throw err;
      if(!user) {
        res.json({ success: false, message: 'No user was found' });  
      }
      else{
        res.json({ success: true, permission: user.permission });
      }
    });

  });

  router.get('/management', function(req, res) {
    User.find({}, function(err, users) {
      if(err) throw err;
      User.findOne({ username: req.decoded.username }, function(err, mainUser) {
        if(err) throw err;
        if(!mainUser) {
          res.json({ success: false, message: 'No user fond' });  
        }
        else{
          if(mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            if(!users) {
              res.json({ message: false, message: 'Users not found' });
            }
            else{
              console.log('/api/management/ success, users found');
              res.json({ success: true, users: users, permission: mainUser.permission });  
            }
          }
          else {
            res.json({ success: false, message: 'Insufficient Permissions' });  
          }
        }
      })

    });
  });


  router.delete('/management/:username', function(req, res) {
    var deletedUser = req.params.username;
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if(err) throw err;
      if(!mainUser) {
        res.json({ success: false, message: 'No user found' });
      }
      else {
        if(mainUser.permission !== 'admin') {
          res.json({ success: false, message: 'Insufficient Permissions' });  
        }
        else {
          User.findOneAndRemove({ username: deletedUser }, function(err, user) {
            if(err) throw err;
            res.json({ success: true });
          });
        }
      }
    });
  });


  router.get('/edit/:id', function(req, res) {
    var editUser = req.params.id;
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if(err) throw err;
      if(!mainUser) {
        res.json({ success: false, message: 'No user found' });  
      }
      else {
        if(mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
          User.findOne({ _id: editUser }, function(err, user) {
            if(err) throw err;
            if(!user) {
              res.json({ success: false, message: 'No user found' });  
            }
            else{
              res.json({ success: true, user: user });  
            }
          });
        }
        else {
          res.json({ success: false, message: 'Insifficient Permissions' }); 
        }
      }
    });
  });


  // Route to update/edit a user
  router.put('/edit', function(req, res) {
    var editUser = req.body._id; // Assign _id from user to be editted to a variable
    if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
    if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested
    if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
    if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
    // Look for logged in user in database to check if have appropriate access
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if (err) throw err; // Throw err if cannot connnect
      // Check if logged in user is found in database
      if (!mainUser) {
        res.json({ success: false, message: "no user found" }); // Return erro
      } else {
        // Check if a change to name was requested
        if (newName) {
          // Check if person making changes has appropriate access
          if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            // Look for user in database
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err; // Throw error if cannot connect
              // Check if user is in database
              if (!user) {
                res.json({ success: false, message: 'No user found' }); // Return error
              } else {
                user.name = newName; // Assign new name to user in database
                // Save changes
                user.save(function(err) {
                  if (err) {
                    console.log(err); // Log any errors to the console
                  } else {
                    res.json({ success: true, message: 'Name has been updated!' }); // Return success message
                  }
                });
              }
            });
          } else {
            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
          }
        }

        // Check if a change to username was requested
        if (newUsername) {
          // Check if person making changes has appropriate access
          if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            // Look for user in database
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err; // Throw error if cannot connect
              // Check if user is in database
              if (!user) {
                res.json({ success: false, message: 'No user found' }); // Return error
              } else {
                user.username = newUsername; // Save new username to user in database
                // Save changes
                user.save(function(err) {
                  if (err) {
                    console.log(err); // Log error to console
                  } else {
                    res.json({ success: true, message: 'Username has been updated' }); // Return success
                  }
                });
              }
            });
          } else {
            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
          }
        }

        // Check if change to e-mail was requested
        if (newEmail) {
          // Check if person making changes has appropriate access
          if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            // Look for user that needs to be editted
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err; // Throw error if cannot connect
              // Check if logged in user is in database
              if (!user) {
                res.json({ success: false, message: 'No user found' }); // Return error
              } else {
                user.email = newEmail; // Assign new e-mail to user in databse
                // Save changes
                user.save(function(err) {
                  if (err) {
                    console.log(err); // Log error to console
                  } else {
                    res.json({ success: true, message: 'E-mail has been updated' }); // Return success
                  }
                });
              }
            });
          } else {
            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
          }
        }

        // Check if a change to permission was requested
        if (newPermission) {
          // Check if user making changes has appropriate access
          if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
            // Look for user to edit in database
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err; // Throw error if cannot connect
              // Check if user is found in database
              if (!user) {
                res.json({ success: false, message: 'No user found' }); // Return error
              } else {
                // Check if attempting to set the 'user' permission
                if (newPermission === 'user') {
                  // Check the current permission is an admin
                  if (user.permission === 'admin') {
                    // Check if user making changes has access
                    if (mainUser.permission !== 'admin') {
                      res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    } else {
                      user.permission = newPermission; // Assign new permission to user
                      // Save changes
                      user.save(function(err) {
                        if (err) {
                          console.log(err); // Long error to console
                        } else {
                          res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                        }
                      });
                    }
                  } else {
                    user.permission = newPermission; // Assign new permission to user
                    // Save changes
                    user.save(function(err) {
                      if (err) {
                        console.log(err); // Log error to console
                      } else {
                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                      }
                    });
                  }
                }
                // Check if attempting to set the 'moderator' permission
                if (newPermission === 'moderator') {
                  // Check if the current permission is 'admin'
                  if (user.permission === 'admin') {
                    // Check if user making changes has access
                    if (mainUser.permission !== 'admin') {
                      res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                    } else {
                      user.permission = newPermission; // Assign new permission
                      // Save changes
                      user.save(function(err) {
                        if (err) {
                          console.log(err); // Log error to console
                        } else {
                          res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                        }
                      });
                    }
                  } else {
                    user.permission = newPermission; // Assign new permssion
                    // Save changes
                    user.save(function(err) {
                      if (err) {
                        console.log(err); // Log error to console
                      } else {
                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                      }
                    });
                  }
                }

                // Check if assigning the 'admin' permission
                if (newPermission === 'admin') {
                  // Check if logged in user has access
                  if (mainUser.permission === 'admin') {
                    user.permission = newPermission; // Assign new permission
                    // Save changes
                    user.save(function(err) {
                      if (err) {
                        console.log(err); // Log error to console
                      } else {
                        res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                      }
                    });
                  } else {
                    res.json({ success: false, message: 'Insufficient Permissions.' }); // Return error
                  }
                }
              }
            });
          } else {
            res.json({ success: false, message: 'Insufficient Permissions' }); // Return error

          }
        }
      }
    });
  });

  return router;
}