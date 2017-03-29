angular.module('emailController', ['userServices'])

// Controller: emailCtrl is used to activate the user's account    
.controller('emailCtrl', function($routeParams, User, $timeout, $location) {

  app = this;

  // Check function that grabs token from URL and checks database runs on page load
  User.activateAccount($routeParams.token).then(function(data) {
    app.errorMsg = false; // Clear errorMsg each time user submits

    // Check if activation was successful or not
    if (data.data.success) {
      app.successMsg = data.data.message + '...Redirecting'; // If successful, grab message from JSON object and redirect to login page
      // Redirect after 2000 milliseconds (2 seconds)
      $timeout(function() {
        $location.path('/');
      }, 2000);
    } else {
      app.errorMsg = data.data.message + '...Redirecting'; // If not successful, grab message from JSON object and redirect to login page
      // Redirect after 2000 milliseconds (2 seconds)
      $timeout(function() {
        $location.path('/login');
      }, 2000);
    }
  });
})

// Controller: resendCtrl is used to resend an activation link to the user's e-mail
.controller('resendCtrl', function(User) {

  app = this;

  // Custom function that check's the user's credentials against the database
  app.checkCredentials = function(loginData) {
    app.disabled = true; // Disable the form when user submits to prevent multiple requests to server
    app.errorMsg = false; // Clear errorMsg each time user submits

    // Runs custom function that check's the user's credentials against the database
    User.checkCredentials(app.loginData).then(function(data) {
      // Check if credentials match
      if (data.data.success) {
        // Custom function that sends activation link
        User.resendLink(app.loginData).then(function(data) {
          console.log(data);
          // Check if sending of link is successful
          if (data.data.success) {
            app.successMsg = data.data.message; // If successful, grab message from JSON object
          } else {
            app.errorMsg = data.data.message; // If not successful, grab message from JSON object
          }
        });
      } else {
        app.disabled = false; // If error occurs, remove disable lock from form
        app.errorMsg = data.data.message; // If credentials do not match, display error from JSON object
      }
    });
  };
})


.controller('usernameCtrl', function(User){
  app = this;
  app.sendUsername = function(userData, valid) {
    app.errorMsg = false;
    app.loading = true;
    app.disabled = true;
    if(valid) {
      User.sendUsername(app.userData.email).then(function(data) {
        app.loading = false;
        if(data.data.success) {
          app.successMsg = data.data.message;  
        }
        else {
          app.disabled = false;
          app.errorMsg = data.data.message;
        }
      });
    }
    else {
      app.disabled = false;
      app.loading = false;
      app.errorMsg = 'Please enter a valid e-mail';  
    }
  };
})


.controller('passwordCtrl', function(User){
  app = this;
  app.sendPassword = function(resetData, valid) {
    app.errorMsg = false;
    app.loading = true;
    app.disabled = true;

    if(valid) {
      User.sendPassword(app.resetData).then(function(data) {
        app.loading = false;

        if(data.data.success) {
          app.successMsg = data.data.message;  
        }
        else {
          app.disabled = false;
          app.errorMsg = data.data.message;
        }
      });
    }
    else {
      app.disabled = false;
      app.loading = false;
      app.errorMsg = 'Please enter a valid username';  
    }
  };
})


.controller('resetCtrl', function(User, $routeParams, $scope) {
  app = this;
  app.hide = true;

  User.resetUser($routeParams.token). then(function(data) {
    if(data.data.success) {
      app.hide = false;
      app.successMsg = 'Please enter a new password';
      $scope.username = data.data.user.username;
    }
    else {
      app.errorMsg = data.data.message;
    }

  });


  app.savedPassword = function(regData, valid, confirmed) {
    app.errorMsg = false;
    app.disabled = true;
    app.loading= true;
    if(valid && confirmed) {
      app.regData.username = $scope.username;
      User.savePassword(app.regData).then(function(data) {
        app.loading = false;
        if(data.data.success) {
          app.successMsg = data.data.message + '...Redirecting';
          $timeout(function() {
            $location.path('/');  
          }, 2000);
        }
        else {
          app.errorMsg= data.data.message;  
          app.disabled = false;
        }
      });
    }
    else {
      app.loading= false;
      app.disabled = false;
      app.errorMsg = 'Please ensure form is filled out properly'; 
    }

  }


});

