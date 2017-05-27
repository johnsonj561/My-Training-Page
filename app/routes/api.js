var User = require('../models/user');
var TrainingModule = require('../models/trainingmodule');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

const AUTH_TOKEN_EXPIRES = '30s';

module.exports = function (router, dotenv) {



	/*
	 * Sendgrid email service
	 * https://sendgrid.com/blog/sending-email-nodemailer-sendgrid/
	 */
	var options = {
		auth: {
			api_user: process.env.SENDGRID_USER,
			api_key: process.env.SENDGRID_KEY
		}
	}
	var client = nodemailer.createTransport(sgTransport(options));

	/*
	 * Register User
	 * validates new user information and stores in mongodb
	 */
	router.post('/users', function (req, res) {
		var user = new User();
		user.username = req.body.username.toLowerCase();
		user.password = req.body.password;
		user.email = req.body.email;
		user.name = req.body.name;
		user.temporarytoken = jwt.sign({
			username: user.username,
			email: user.email
		}, process.env.SECRET, {
			expiresIn: '24h'
		});
		if (req.body.username == null || req.body.username == "" ||
			req.body.password == null || req.body.password == "" ||
			req.body.email == null || req.body.email == "" ||
			req.body.name == null || req.body.name == "") {
			res.json({
				success: false,
				message: "Ensure username, email, and password were provided"
			});
		} else {
			user.save(function (err) {
				if (err) {

					// if we have received error message from model.user.js validation
					if (err.errors != null) {
						if (err.errors.name) {
							res.json({
								success: false,
								message: err.errors.name.message
							});
						} else if (err.errors.email) {
							res.json({
								success: false,
								message: err.errors.email.message
							});
						} else if (err.errors.username) {
							res.json({
								success: false,
								message: err.errors.username.message
							});
						} else if (err.errors.password) {
							res.json({
								success: false,
								message: err.errors.password.message
							});
						} else {
							res.json({
								success: false,
								message: err
							});
						}
					} else if (err) {
						if (err.code == 11000) {
							res.json({
								success: false,
								message: "Username or email already exists in database"
							});
						} else {
							res.json({
								success: false,
								message: err
							});
						}
					}
				}
				// else no error, return success
				else {

					var email = {
						from: 'My Training Page Staff, staff@mytrainingpage.com',
						to: user.email,
						subject: 'Hello From MyTrainingPage',
						text: 'Hello ' + user.name + ', Thank you for registering at My Training Page' +
							' Please click on the link to complete your activation: ' + process.env.HOST + '/activate/' + user.temporarytoken,
						html: 'Hello <strong>' + user.name + ',</strong><br><br>Thank you for registering at My Training Page<br>' +
							' Please click on the link below to complete your activation: <br><br><a href="' + process.env.HOST + '/activate/' +
							user.temporarytoken + '">' + 'ACTIVATE ACCOUNT</a>'
					};
					client.sendMail(email, function (err, info) {
						if (err) {
							console.log(err);
						} else {
							console.log('Message sent: ' + info.response);
						}
					});

					res.json({
						success: true,
						message: "Account registered!. Please checkyour e-mail for activation link."
					});
				}
			});
		}
	});


	/*
	 * Update User Profile
	 */
	router.post('/updateuser', function (req, res) {
		var editUser = req.body._id;
		// Look for user that needs to be editted
		User.findOne({
			_id: editUser
		}, function (err, user) {
			if (err) throw err; // Throw error if cannot connect
			// Check if logged in user is in database
			if (!user) {
				res.json({
					success: false,
					message: 'No user found'
				}); // Return error
			} else {
				// update user profile data
				user.email = req.body.email;
				user.name = req.body.name;
				if (req.body.password) {
					console.log('password provided');
					user.password = req.body.password;
				}
				user.save(function (err) {
					if (err) {
						console.log(err); // Log error to console
					} else {
						res.json({
							success: true,
							message: 'Profile has been updated'
						});
					}
				});
			}
		});
	});


	/*
	 * Update Password
	 */
	router.post('/updatepassword', function (req, res) {
		var editUser = req.body._id;
		User.findOne({
			_id: editUser
		}, function (err, user) {
			if (err) throw err;

			if (!user) {
				res.json({
					success: false,
					message: 'No user found in database'
				});
			} else {
				user.password = req.body.password;
				user.save(function (err) {
					if (err) {
						throw err;
					} else {
						res.json({
							success: true,
							message: 'Your password has been udpated'
						});
					}
				});
			}
		});
	});


	/*
	 * Login User
	 * Validates login info and creates session
	 */
	router.post('/authenticate', function (req, res) {
		var username = req.body.username.toLowerCase();
		User.findOne({
			username: username
		}).select('email username password active').exec(function (err, user) {
			if (err) throw err;
			if (!user) { // bad username provided
				res.json({
					success: false,
					message: 'Invalid username, please try again'
				});
			} else if (user) { // username is valid

				if (req.body.password) { // password is not empty
					var validPassword = user.comparePassword(req.body.password);
					if (!validPassword) { // password does not match
						res.json({
							success: false,
							message: 'Could not validate password, please try again'
						});
					} else if (!user.active) {
						res.json({
							success: false,
							message: 'Account is not yet activated. Please check email for activation link.',
							expired: true
						});
					} else {
						var token = jwt.sign({
								username: user.username,
								email: user.email
							},
							process.env.SECRET, {
								expiresIn: '1h'
							});
						res.json({
							success: true,
							message: 'User Authenticated',
							token: token
						});
					}
				} else {
					res.json({
						success: false,
						message: 'No password provided'
					});
				}
			}
		});
	});

	/*
	 * Check Username
	 * Returns true if username is valid (does not already exist)
	 */
	router.post('/checkusername', function (req, res) {
		var username = req.body.username.toLowerCase();
		User.findOne({
			username: username
		}).select('username').exec(function (err, user) {
			if (err) throw err;
			if (user) {
				res.json({
					success: false,
					message: 'That username is already taken'
				});
			} else {
				res.json({
					success: true,
					message: 'Valid username'
				});
			}
		})
	});

	/*
	 * Check Email
	 * Returns true if email is valid (does noe already exist)
	 */
	router.post('/checkemail', function (req, res) {
		User.findOne({
			email: req.body.email
		}).select('email').exec(function (err, user) {
			if (err) throw err;

			if (user) {
				res.json({
					success: false,
					message: 'That email is already taken'
				});
			} else {
				res.json({
					success: true,
					message: 'Valid e-mail'
				});
			}
		})
	});


	/*
	 * Activate Account
	 * 
	 */
	router.put('/activate/:token', function (req, res) {
		User.findOne({
			temporarytoken: req.params.token
		}, function (err, user) {
			if (err) throw err; // Throw error if cannot login
			var token = req.params.token; // Save the token from URL for verification 
			// Function to verify the user's token
			jwt.verify(token, process.env.SECRET, function (err, decoded) {
				if (err) {
					res.json({
						success: false,
						message: 'Activation link has expired.'
					}); // Token is expired
				} else if (!user) {
					res.json({
						success: false,
						message: 'Activation link has expired.'
					}); // Token may be valid but does not match any user in the database
				} else {
					user.temporarytoken = false; // Remove temporary token
					user.active = true; // Change account status to Activated
					// Mongoose Method to save user into the database
					user.save(function (err) {
						if (err) {
							console.log(err); // If unable to save user, log error info to console/terminal
						} else {
							// If save succeeds, create e-mail object
							var email = {
								from: 'My Training Page Staff, staff@mytrainingpage.com',
								to: user.email,
								subject: 'My Training Page Account Activated',
								text: 'Hello ' + user.name + ', Your account has been successfully activated!',
								html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Your account has been successfully activated!'
							};
							// Send e-mail object to user
							client.sendMail(email, function (err, info) {
								if (err) console.log(err); // If unable to send e-mail, log error info to console/terminal
							});
							res.json({
								success: true,
								message: 'Account activated!'
							}); // Return success message to controller
						}
					});
				}
			});
		});
	});


	/*
	 * Resend Activation Verification
	 * Verifies user credentials before re-sending activation link
	 */
	router.post('/resend', function (req, res) {
		var username = req.body.username.toLowerCase();
		User.findOne({
			username: username
		}).select('username password active').exec(function (err, user) {
			if (err) throw err; // Throw error if cannot connect
			// Check if username is found in database
			if (!user) {
				res.json({
					success: false,
					message: 'Invalid username'
				}); // Username does not match username found in database
			} else if (user) {
				// Check if password is sent in request
				if (req.body.password) {
					var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
					if (!validPassword) {
						res.json({
							success: false,
							message: 'Could not validate password'
						}); // Password does not match password found in database
					} else if (user.active) {
						res.json({
							success: false,
							message: 'Account is already activated'
						}); // Account is already activated
					} else {
						res.json({
							success: true,
							user: user
						});
					}
				} else {
					res.json({
						success: false,
						message: 'No password provided'
					}); // No password was provided
				}
			}
		});
	});

	/*
	 * Resent Activation Link
	 * Sends user new email with account activation link
	 */
	router.put('/resend', function (req, res) {
		var username = req.body.username.toLoweCase();
		User.findOne({
			username: username
		}).select('username name email temporarytoken').exec(function (err, user) {
			if (err) throw err; // Throw error if cannot connect
			user.temporarytoken = jwt.sign({
				username: user.username,
				email: user.email
			}, process.env.SECRET, {
				expiresIn: '24h'
			}); // Give the user a new token to reset password
			// Save user's new token to the database
			user.save(function (err) {
				if (err) {
					console.log(err); // If error saving user, log it to console/terminal
				} else {
					// If user successfully saved to database, create e-mail object
					var email = {
						from: 'My Training Page Staff, staff@mytrainingpage.com',
						to: user.email,
						subject: 'My Training Page Activation Request',
						text: 'Hello ' + user.name + ', You recently requested a new account activation link. Please click on the following link to complete your activation: ' + process.env.HOST + '/activate/' + user.temporarytoken,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="' + process.env.HOST + '/activate/' + user.temporarytoken + '">ACTIVATE ACCOUNT</a>'
					};

					// Function to send e-mail to user
					client.sendMail(email, function (err, info) {
						if (err) console.log(err); // If error in sending e-mail, log to console/terminal
					});
					res.json({
						success: true,
						message: 'Activation link has been sent to ' + user.email + '!'
					}); // Return success message to controller
				}
			});
		});
	});



	/*
	 * Reset Username Request
	 * Sends user email with username
	 */
	router.get('/resetusername/:email', function (req, res) {
		User.findOne({
			email: req.params.email
		}).select('email name username').exec(function (err, user) {
			if (err) {
				res.json({
					success: false,
					message: err
				}); // Error if cannot connect
			} else {
				if (!user) {
					res.json({
						success: false,
						message: 'E-mail was not found'
					}); // Return error if e-mail cannot be found in database
				} else {
					// If e-mail found in database, create e-mail object
					var email = {
						from: 'My Training Page Staff, staff@mytrainingpage.com',
						to: user.email,
						subject: 'My Training Page Username Request',
						text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
					};
					// Function to send e-mail to user
					client.sendMail(email, function (err, info) {
						if (err) console.log(err); // If error in sending e-mail, log to console/terminal
					});
					res.json({
						success: true,
						message: 'Your username has been sent to the email address on file'
					});
				}
			}
		});
	});

	/*
	 * Reset Password Request
	 * Sends email to user with reset password link
	 */
	router.put('/resetpassword', function (req, res) {
		var username = req.body.username.toLowerCase();
		User.findOne({
			username: username
		}).select('username active email resettoken name').exec(function (err, user) {
			if (err) throw err;
			if (!user) {
				res.json({
					success: false,
					message: 'Username was not found'
				}); // Return error if username is not found in database
			} else if (!user.active) {
				res.json({
					success: false,
					message: 'Account has not yet been activated'
				}); // Return error if account is not yet activated
			} else {
				user.resettoken = jwt.sign({
					username: user.username,
					email: user.email
				}, process.env.SECRET, {
					expiresIn: '24h'
				}); // Create a token for activating account through e-mail
				// Save token to user in database
				user.save(function (err) {
					if (err) {
						res.json({
							success: false,
							message: err
						}); // Return error if cannot connect
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'My Training Page Staff, staff@mytrainingpage.com',
							to: user.email,
							subject: 'My Training Page Reset Password Request',
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link to reset your password: ' + process.env.HOST + '/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="' + process.env.HOST + '/reset/' + user.resettoken + '">RESET PASSWORD</a>'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function (err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({
							success: true,
							message: 'Please check your e-mail for password reset link'
						});
					}
				});
			}
		});
	});

	/*
	 * Reset Password Link 
	 */
	router.get('/resetpassword/:token', function (req, res) {
		User.findOne({
			resettoken: req.params.token
		}).select().exec(function (err, user) {
			if (err) throw err; // Throw err if cannot connect
			var token = req.params.token; // Save user's token from parameters to variable
			// Function to verify token
			jwt.verify(token, process.env.SECRET, function (err, decoded) {
				if (err) {
					res.json({
						success: false,
						message: 'Password link has expired'
					}); // Token has expired or is invalid
				} else {
					if (!user) {
						res.json({
							success: false,
							message: 'Password link has expired'
						}); // Token is valid but not no user has that token anymore
					} else {
						res.json({
							success: true,
							user: user
						}); // Return user object to controller
					}
				}
			});
		});
	});

	/*
	 * Save Password
	 */
	router.put('/savepassword', function (req, res) {
		var username = req.body.username.toLowerCase();
		User.findOne({
			username: username
		}).select('username email name password resettoken').exec(function (err, user) {
			if (err) throw err; // Throw error if cannot connect
			if (req.body.password == null || req.body.password == '') {
				res.json({
					success: false,
					message: 'Password not provided'
				});
			} else {
				user.password = req.body.password; // Save user's new password to the user object
				user.resettoken = false; // Clear user's resettoken 
				// Save user's new data
				user.save(function (err) {
					if (err) {
						res.json({
							success: false,
							message: err
						});
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'My Training Page Staff, staff@mytrainingpage.com',
							to: user.email,
							subject: 'My Training Page Reset Password',
							text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at http://www.mytrainingpage.com',
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at  http://www.mytrainingpage.com'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function (err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({
							success: true,
							message: 'Password has been reset!'
						}); // Return success message
					}
				});
			}
		});
	});



	/*
	 * MIDDLEWARE
	 * Checks for valid token before proceeding
	 */
	router.use(function (req, res, next) {
		var token = req.body.token || req.body.query || req.headers['x-access-token'];
		if (token) {
			jwt.verify(token, process.env.SECRET, function (err, decoded) {
				if (err) {
					res.json({
						success: false,
						message: 'Token invalid'
					});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			res.json({
				success: false,
				message: 'No token provided'
			});
		}
	});


	/*
	 * Returns decoded request
	 */
	router.post('/me', function (req, res) {
		res.send(req.decoded);
	});

	/*
	 * Renew Token
	 * Renews user token for 24 hours
	 */
	router.get('/renewToken/:username', function (req, res) {
		var username = req.params.username.toLowerCase();
		User.findOne({
			username: username
		}).select().exec(function (err, user) {
			if (err) throw err;
			if (!user) {
				res.json({
					success: false,
					message: 'No user was found'
				});
			} else {
				var newToken = jwt.sign({
					username: user.username,
					email: user.email
				}, process.env.SECRET, {
					expiresIn: '24h'
				});
				res.json({
					success: true,
					token: newToken
				});
			}
		});

	});

	/*
	 * Get Permission
	 * Returns current user's permission
	 */
	router.get('/permission', function (req, res) {
		var username = req.decoded.username.toLowerCase();
		User.findOne({
			username: username
		}, function (err, user) {
			if (err) throw err;
			if (!user) {
				res.json({
					success: false,
					message: 'No user was found'
				});
			} else {
				res.json({
					success: true,
					permission: user.permission
				});
			}
		});

	});

	/*
	 * Management
	 * Returns list of all users and the current users permission
	 */
	router.get('/management', function (req, res) {
		User.find({}, function (err, users) {
			if (err) throw err;
			User.findOne({
				username: req.decoded.username.toLowerCase()
			}, function (err, mainUser) {
				if (err) throw err;
				if (!mainUser) {
					res.json({
						success: false,
						message: 'No user fond'
					});
				} else {
					if (mainUser.permission === 'admin') {
						if (!users) {
							res.json({
								message: false,
								message: 'Users not found'
							});
						} else {
							res.json({
								success: true,
								users: users,
								permission: mainUser.permission
							});
						}
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						});
					}
				}
			})

		});
	});


	/*
	 * Get Users that do not have a training module assigned with id = trainingId
	 * Allows view to only display users not already assigned to a training module
	 */
	router.get('/management/:id', function (req, res) {
		var trainingId = req.params.id;
		console.log('loading users that do not have assignment id ' + trainingId);
		User.find({
			'assignments.module._id': {
				$ne: trainingId
			}
		}, function (err, users) {
			if (err) throw err;
			if (!users) {
				res.json({
					message: false,
					message: 'Users not found'
				});
			} else {
				console.log('/api/management/ success, users found');
				res.json({
					success: true,
					users: users
				});
			}
		});

	});

	/*
	 * Delete User with specified username from db
	 */
	router.delete('/management/:username', function (req, res) {
		var deletedUser = req.params.username.toLowerCase();
		User.findOne({
			username: username
		}, function (err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({
					success: false,
					message: 'No user found'
				});
			} else {
				if (mainUser.permission !== 'admin') {
					res.json({
						success: false,
						message: 'Insufficient Permissions'
					});
				} else {
					User.findOneAndRemove({
						username: deletedUser
					}, function (err, user) {
						if (err) throw err;
						res.json({
							success: true
						});
					});
				}
			}
		});
	});

	/* 
	 * Edit user with specified ID
	 * Verifies current user's permissions first
	 */
	router.get('/edit/:id', function (req, res) {
		var editUser = req.params.id;
		User.findOne({
			username: req.decoded.username.toLowerCase()
		}, function (err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({
					success: false,
					message: 'No admin user found'
				});
			} else {
				if (mainUser.permission === 'admin') {
					User.findOne({
						_id: editUser
					}, function (err, user) {
						if (err) throw err;
						if (!user) {
							res.json({
								success: false,
								message: 'No user found'
							});
						} else {
							res.json({
								success: true,
								user: user
							});
						}
					});
				} else {
					res.json({
						success: false,
						message: 'Insifficient Permissions'
					});
				}
			}
		});
	});

	/*
	 * Get current user profile
	 */
	router.get('/getcurrent', function (req, res) {
		User.findOne({
			username: req.decoded.username.toLowerCase()
		}, function (err, user) {
			if (err) throw err;
			if (!user) {
				res.json({
					success: false,
					message: 'No user found'
				});
			} else {
				res.json({
					success: true,
					message: 'User found',
					user: user
				});
			}
		})
	});


	/*
	 * Edit User
	 * Updates db with user's new information
	 */
	router.put('/edit', function (req, res) {
		var editUser = req.body._id; // Assign _id from user to be editted to a variable
		if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
		if (req.body.username) var newUsername = req.body.username.toLowerCase(); // Check if a change to username was requested
		if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
		if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
		// Look for logged in user in database to check if have appropriate access
		User.findOne({
			username: req.decoded.username.toLowerCase()
		}, function (err, mainUser) {
			if (err) throw err; // Throw err if cannot connnect
			// Check if logged in user is found in database
			if (!mainUser) {
				res.json({
					success: false,
					message: "no user found"
				}); // Return erro
			} else {
				// Check if a change to name was requested
				if (newName) {
					// Check if person making changes has appropriate access
					if (mainUser.permission === 'admin') {
						// Look for user in database
						User.findOne({
							_id: editUser
						}, function (err, user) {
							if (err) throw err; // Throw error if cannot connect
							// Check if user is in database
							if (!user) {
								res.json({
									success: false,
									message: 'No user found'
								}); // Return error
							} else {
								user.name = newName; // Assign new name to user in database
								// Save changes
								user.save(function (err) {
									if (err) {
										console.log(err); // Log any errors to the console
									} else {
										res.json({
											success: true,
											message: 'Name has been updated!'
										}); // Return success message
									}
								});
							}
						});
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						}); // Return error
					}
				}

				// Check if a change to username was requested
				if (newUsername) {
					// Check if person making changes has appropriate access
					if (mainUser.permission === 'admin') {
						// Look for user in database
						User.findOne({
							_id: editUser
						}, function (err, user) {
							if (err) throw err; // Throw error if cannot connect
							// Check if user is in database
							if (!user) {
								res.json({
									success: false,
									message: 'No user found'
								}); // Return error
							} else {
								user.username = newUsername; // Save new username to user in database
								// Save changes
								user.save(function (err) {
									if (err) {
										console.log(err); // Log error to console
									} else {
										res.json({
											success: true,
											message: 'Username has been updated'
										}); // Return success
									}
								});
							}
						});
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						}); // Return error
					}
				}

				// Check if change to e-mail was requested
				if (newEmail) {
					// Check if person making changes has appropriate access
					if (mainUser.permission === 'admin') {
						// Look for user that needs to be editted
						User.findOne({
							_id: editUser
						}, function (err, user) {
							if (err) throw err; // Throw error if cannot connect
							// Check if logged in user is in database
							if (!user) {
								res.json({
									success: false,
									message: 'No user found'
								}); // Return error
							} else {
								user.email = newEmail; // Assign new e-mail to user in databse
								// Save changes
								user.save(function (err) {
									if (err) {
										console.log(err); // Log error to console
									} else {
										res.json({
											success: true,
											message: 'E-mail has been updated'
										}); // Return success
									}
								});
							}
						});
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						}); // Return error
					}
				}

				// Check if a change to permission was requested
				if (newPermission) {
					// Check if user making changes has appropriate access
					if (mainUser.permission === 'admin') {
						// Look for user to edit in database
						User.findOne({
							_id: editUser
						}, function (err, user) {
							if (err) throw err; // Throw error if cannot connect
							// Check if user is found in database
							if (!user) {
								res.json({
									success: false,
									message: 'No user found'
								}); // Return error
							} else {
								// Check if attempting to set the 'user' permission
								if (newPermission === 'user') {
									// Check the current permission is an admin
									if (user.permission === 'admin') {
										// Check if user making changes has access
										if (mainUser.permission !== 'admin') {
											res.json({
												success: false,
												message: 'Insufficient Permissions'
											}); // Return error
										} else {
											user.permission = newPermission; // Assign new permission to user
											// Save changes
											user.save(function (err) {
												if (err) {
													console.log(err); // Long error to console
												} else {
													res.json({
														success: true,
														message: 'Permissions have been updated!'
													}); // Return success
												}
											});
										}
									} else {
										user.permission = newPermission; // Assign new permission to user
										// Save changes
										user.save(function (err) {
											if (err) {
												console.log(err); // Log error to console
											} else {
												res.json({
													success: true,
													message: 'Permissions have been updated!'
												}); // Return success
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
										user.save(function (err) {
											if (err) {
												console.log(err); // Log error to console
											} else {
												res.json({
													success: true,
													message: 'Permissions have been updated!'
												}); // Return success
											}
										});
									} else {
										res.json({
											success: false,
											message: 'Insufficient Permissions.'
										}); // Return error
									}
								}
							}
						});
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						}); // Return error

					}
				}
			}
		});
	});


	/*
	 * Get Training Module
	 * Returns training module with specified id
	 */
	router.get('/trainingmodule/:id', function (req, res) {
		TrainingModule.findOne({
			_id: req.params.id
		}, function (err, trainingmodule) {
			if (err) throw err;
			if (!trainingmodule) {
				res.json({
					success: false,
					message: 'No trainingmodule found'
				});
			} else {
				res.json({
					success: true,
					message: 'trainingmodule found',
					trainingmodule: trainingmodule
				});
			}
		});
	});


	/*
	 * Get User Training
	 * Returns all training modules assigned to user with specified id
	 */
	router.get('/usertraining/:id', function (req, res) {
		User.find({
			_id: req.params.id
		}).select('assignments').exec(function (err, assignments) {
			if (err) throw err;
			if (!assignments) {
				res.json({
					success: false,
					message: 'No assignments were found for this user.'
				});
			} else {
				res.json({
					success: true,
					assignments: assignments
				});
			}
		});

	});

	/*
	 * Get User Training
	 * Returns all training modules assigned to user with specified id
	 */
	router.get('/usertraining', function (req, res) {
		User.find({
			username: req.decoded.username.toLowerCase()
		}).select('assignments').exec(function (err, assignments) {
			if (err) throw err;
			if (!assignments) {
				res.json({
					success: false,
					message: 'No assignments were found for this user.'
				});
			} else {
				res.json({
					success: true,
					assignments: assignments
				});
			}
		});

	});

	/*
	 * Get All Training
	 * Returns all available training modules to populate assignment page
	 */
	router.get('/alltraining', function (req, res) {
		TrainingModule.find({}).select('name author description lastEdit').exec(function (err, modules) {
			if (err) throw err;
			if (!modules) {
				res.json({
					success: false,
					message: 'No training modules were found.'
				});
			} else {
				res.json({
					success: true,
					message: 'Training modules found.',
					modules: modules
				});
			}
		});
	});


	/*
	 * Assign Training Modules
	 * Adds the specified training module to select users
	 */
	router.put('/assignTraining', function (req, res) {
		// for each user, update their assigments
		var users = req.body.selectedUsers;
		// build training module object to push into assignments object
		var module = {};
		module._id = req.body.selectedModule._id;
		module.name = req.body.selectedModule.name;
		module.description = req.body.selectedModule.description;
		module.score = -1;
		var date = new Date();
		module.assignedDate = (date.getMonth() + 1) + '/' + (date.getDate()) + '/' + (date.getFullYear());
		// for each user, push training module into assignments array
		users.forEach(function (user) {
			User.findByIdAndUpdate(
				user, {
					$addToSet: {
						"assignments": {
							module
						}
					}
				}, {
					safe: true,
					upsert: true
				},
				function (err, user) {
					if (err) throw err;
					if (!user) {
						res.json({
							success: false,
							message: 'User not found, unable to assign training module. Redirecting to menu...'
						});
					}
				}
			)
		});

		// update the training module  by incrememnting the total assigned count
		TrainingModule.findOne({
			_id: module._id
		}, function (err, updateModule) {
			if (err) throw err;
			if (!updateModule) {
				res.json({
					success: false,
					message: 'Unable to update training module, no training module found.'
				});
			} else {
				updateModule.assignedCount = updateModule.assignedCount + users.length;
				updateModule.save(function (err) {
					if (err) throw err;
					else {
						// return success message
						res.json({
							success: true,
							message: 'Training Module Assignments Complete, Redirecting To Menu...'
						});
					}
				});
			}
		});
	});

	/*
	 * Store User Training Data
	 * Updates User Assignments with completed training module data
	 * If success, return the user's previous score, it will be needed to update training module
	 */
	router.put('/storeusertrainingdata', function (req, res) {
		console.log('in updateUserAssignmentScores api: ' + req.body);
		var trainingData = req.body;
		var date = new Date();
		date = (date.getMonth() + 1) + '/' + (date.getDate()) + '/' + (date.getFullYear());
		// update the user
		User.findOneAndUpdate({
				"_id": trainingData.user,
				"assignments.module._id": trainingData.module._id
			}, {
				"$set": {
					"assignments.$.module.score": trainingData.module.score,
					"assignments.$.module.completionDate": date
				}
			},
			function (err, user) {
				if (err) throw err;
				if (!user) {
					res.json({
						success: false,
						message: 'No user found, unable to update training data for user.'
					});
				}
				// user found, update data
				else {
					res.json({
						success: true,
						message: 'User found',
						user: user
					});
				}
			});
	});

	/*
	 * Update Scores
	 * Updates user's assignment data to reflect changes in training module score
	 */
	router.put('/updateScores', function (req, res) {
		console.log('in updateTrainingModuleScores api: ' + req.body);
		var module_id = req.body.module._id;
		var newScore = req.body.module.score;
		var scoreOffset = req.body.isRetake ? req.body.scoreDifference : req.body.module.score;
		TrainingModule.findOne({
			_id: module_id
		}, function (err, module) {
			if (err) throw err;
			if (!module) {
				res.json({
					success: false,
					message: 'Unable to update Training Module with the new score results'
				});
			}
			// update the training module with new scores and return
			else {
				module.totalScores = module.totalScores * 1 + scoreOffset * 1;
				// if this is first person to complete training module, initialize high/low scores
				if (module.completedCount === 0) {
					module.lowScore = newScore;
					module.highScore = newScore;
				}
				// else compare high/low score and set as needed
				else {
					if (newScore < module.lowScore) {
						module.lowScore = newScore;
					} else if (newScore > module.highScore) {
						module.highScore = newScore;
					}
				}
				// if it's first time completing course, incremement completed counter
				if (!req.body.isRetake) {
					module.completedCount++;
				}
				// save changes
				module.save(function (err) {
					if (err) throw err;
					else {
						res.json({
							success: true,
							message: 'Training Module scores/stats updated successfully'
						});
					}
				});
			}
		});
	});


	/*
	 * Get User Completion Rate
	 * Calculates percentage of how many training modules have been completed by user
	 */
	router.get('/usercompletionrate', function (req, res) {
		User.findOne({
			username: req.decoded.username
		}, function (err, user) {
			if (err) throw err;
			if (!user) {
				res.json({
					success: false,
					message: 'No user found'
				});
			} else {
				var assignedCount = user.assignments.length;
				var completedCount = 0;
				for (var i = 0; i < user.assignments.length; i++) {
					if (user.assignments[i].module.score > -1) {
						completedCount++;
					}
				}
				var result = Math.ceil((completedCount / assignedCount) * 100);
				res.json({
					success: true,
					completionRate: result,
					assignmentCount: assignedCount
				});
			}

		});
	});


	/*
	 * Management
	 * Returns list of all users and the current users permission
	 */
	router.get('/management', function (req, res) {
		User.find({}, function (err, users) {
			if (err) throw err;
			User.findOne({
				username: req.decoded.username.toLowerCase()
			}, function (err, mainUser) {
				if (err) throw err;
				if (!mainUser) {
					res.json({
						success: false,
						message: 'No user found'
					});
				} else {
					if (mainUser.permission === 'admin') {
						if (!users) {
							res.json({
								message: false,
								message: 'Users not found'
							});
						} else {
							res.json({
								success: true,
								users: users,
								permission: mainUser.permission
							});
						}
					} else {
						res.json({
							success: false,
							message: 'Insufficient Permissions'
						});
					}
				}
			})

		});
	});


	return router;
}
