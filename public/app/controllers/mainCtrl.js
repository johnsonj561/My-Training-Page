angular.module('mainController', ['authServices', 'userServices'])

  .controller('mainCtrl', function(Auth, $timeout, $location, $rootScope, $window, $interval, $route, User, AuthToken){

  var app = this;

  const TOKEN_EXPIRED_MODAL = 1;
  const PROMPT_LOGOUT_MODAL = 2;
  const TRAINING_SCORE =  3;
  // web site will warn user when app has 5 minutes until expiration
  const SESSION_EXPIRE_WARNING_TIME = 60*5;

  /*
  * Check Session
  * If logged in, recurring interval set to check for valid token
  * When token is near expiration, use will be promted to renew token
  */
  app.checkSession = function() {
    if(Auth.isLoggedIn()) {
      app.checkingSession = true;
      var interval = $interval(function() {
        var token = $window.localStorage.getItem('token');
        if(token === null) {
          $interval.cancel(interval);
        }
        else {
          self.parseJwt = function(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('.', '+').replace('_', '/');
            return JSON.parse($window.atob(base64));
          }

          // get the expiration time from token (initialized to 1 hour)
          var expireTime = self.parseJwt(token);
          // get current time stamp
          var timeStamp = Math.floor(Date.now() /1000);
          // calc time til expiration = expiration time - current time
          var timeLeft = expireTime.exp - timeStamp;
          if(timeLeft <= SESSION_EXPIRE_WARNING_TIME) {
            showModal(TOKEN_EXPIRED_MODAL);
            $interval.cancel(interval);
          }

        }
      }, 10000);
    }
  };

  app.checkSession();

  var showModal = function(option, score) {
    app.choiceMade = false;
    app.modalHeader = undefined;
    app.modalBody = undefined;
    app.hideButton = false;

    if(option === TOKEN_EXPIRED_MODAL) {
      app.modalHeader = 'Timeout Warning';
      app.modalBody = 'Your session will expire in 1 minute. Would you like to renew your session?';
      $('#myModal').modal({ backdrop: 'static' });
    }
    else if(option === PROMPT_LOGOUT_MODAL){
      app.hideButton = true; // Hide 'yes'/'no' buttons
      app.modalHeader = 'Logging Out'; // Set header
      $("#myModal").modal({ backdrop: "static" }); // Open modal
      // After 1000 milliseconds (1 second), hide modal and log user out
      $timeout(function() {
        Auth.logout(); // Logout user
        $location.path('/'); // Change route to clear user object
        hideModal(); // Close modal
        $route.reload();
      }, 1000);
    }
    else if(option === TRAINING_SCORE) {
      app.hideButton = true;
      app.showCloseButton = true;
      app.modalHeader = 'Training Module Complete!';
      if(score > 90) {
        app.modalBody = 'Congratulations! You scored a ' + score + '. Keep up the good work!';
      }
      else if(score > 75) {
        app.modalBody = 'You scored a ' + score + '. Feel free to re-test if you want to get a higher score.';
      }
      else {
        app.modalBody = 'You finished the course, but only scored a ' + score + '. You should try again';
      }
      $('#myModal').modal({ backdrop: 'static' });
      $timeout(function() {
        $location.path('/menu'); // Change route to clear user object
        $route.reload();
      }, 1500);
    }


    // if no choice is made after 10 seconds, then log user out
    $timeout(function() {
      if(!app.choiceMade && option === PROMPT_LOGOUT_MODAL) {
        Auth.logout(); // Logout user
        $location.path('/'); // Change route to clear user object
        hideModal();
      }
    }, 10000);
  };

  app.renewSession = function() {
    app.choiceMade = true;

    User.renewSession(app.username).then(function(data) {
      if(data.data.success) {
        AuthToken.setToken(data.data.token);
        app.checkSession();
      }
      else {
        app.modalBody = data.data.message;
      }
    });
    hideModal();
  };


  app.endSession = function() {
    app.choiceMade = true;

    hideModal();

    $timeout(function() {
      showModal(PROMPT_LOGOUT_MODAL);  
    }, 1000);
  };

  var hideModal = function() {
    $('#myModal').modal('hide');  
  };

  // using loadme to hide hide HTML until loadme is true
  // this will prevent the angular {{ }} displaying during page loading
  app.loadme = false;

  /*
  * Invoked whenever route changes
  */
  $rootScope.$on('$routeChangeStart', function() {

    if(!app.checkingSession) {
      app.checkSession();
    }

    if(Auth.isLoggedIn()) {
      app.isLoggedIn = true;
      Auth.getUser().then(function(data) {
        app.username = data.data.username;
        app.useremail = data.data.email;

        User.getPermission().then(function(data) {
          if(data.data.permission === 'admin') {
            app.authorized = true;
            app.loadme = true;
          }
          else{
            app.loadme = true;
          }
        });
        app.loadme = true;
      });
    }

    else{
      app.isLoggedIn = false;
      app.username = "";
      app.useremail = "";
      app.loadme = true;
    }

    // remove facebook's return url garbage
    if($location.hash() == '_=_') {
      $location.hash(null);
    }

  });

  // prevent facebook login from opening new window
  this.facebook = function() {
    app.disabled = true;
    $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/facebook'; 
  };


  // prevent google login from opening new window
  this.google = function() {
    app.disabled = true;
    $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/google'; 
  };



  /*
  * User Login
  */
  this.doLogin = function(loginData) {
    app.loading = true;
    app.errorMsg = false;
    app.successMsg = false;
    app.expired = false;
    app.disabled = true;

    Auth.login(app.loginData).then(function(data) {
      if(data.data.success) {
        // Hide loading and ceate success message
        app.loading = false;
        app.successMsg = data.data.message + ' Redirecting';
        // Redirect to home page
        $timeout(function() {
          app.loginData = {};
          app.successMsg = false;
          $location.path('/menu');
          app.checkSession();
        }, 1000);
      }
      else{
        if(data.data.expired) {
          app.expired = true;
          app.loading = false;
          app.errorMsg = data.data.message;
        }
        else {
          app.loading = false;
          app.errorMsg = data.data.message;
          app.disabled = false;
        }
      }

    });
  };

  // prompt user to confirm logout action
  app.logout = function() {
    showModal(PROMPT_LOGOUT_MODAL);
  };


});