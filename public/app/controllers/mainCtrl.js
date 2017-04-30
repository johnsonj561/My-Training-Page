angular.module('mainController', ['authServices', 'userServices'])

  .controller('mainCtrl', function(Auth, $timeout, $location, $rootScope, $window, $interval, $route, User, AuthToken){

  var app = this;

  const TOKEN_EXPIRED_MODAL = 1;
  const PROMPT_LOGOUT_MODAL = 2;
  const TRAINING_SCORE =  3;
  // warn user when app has 60 seconds remaining
  const SESSION_EXPIRE_WARNING_TIME = 60;
  // display the expiration warning modal for 15 seconds
  const SESSION_EXPIRE_MODAL_DELAY = 1000*15;
  // check session every 30 seconds
  const CHECK_SESSION_INTERVAL = 1000*30;
  
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
          if(timeLeft < 0) {
            Auth.logout();
            app.checkingSession = false;
            app.isLoggedIn = false;
            $location.path('/');
          }
          else if(timeLeft <= SESSION_EXPIRE_WARNING_TIME) {
            showModal(TOKEN_EXPIRED_MODAL);
            $interval.cancel(interval);
          }
        }
      }, CHECK_SESSION_INTERVAL);
    }
  };

  app.checkSession();

  var showModal = function(option) {
    app.modalHeader = undefined;
    app.modalBody = undefined;
    app.hideButton = false;

    if(option === TOKEN_EXPIRED_MODAL) {
      app.choiceMade = false;
      app.modalHeader = 'Timeout Warning';
      app.modalBody = 'Your session is about to expire, would you like to renew your session?';
      $('#myModal').modal({ backdrop: 'static' });
      // if no choice is made after 10 seconds, then log user out
      $timeout(function() {
        if(!app.choiceMade) {
          Auth.logout(); // Logout user
          //$location.path('/'); // Change route to clear user object
          app.endSession();
        }
      }, SESSION_EXPIRE_MODAL_DELAY);
    }

    else if(option === PROMPT_LOGOUT_MODAL){
      app.hideButton = true; // Hide 'yes'/'no' buttons
      app.modalHeader = 'Logging Out'; // Set header
      $("#myModal").modal({ backdrop: "static" }); // Open modal
      // After 1000 milliseconds (1 second), hide modal and log user out
      $timeout(function() {
        Auth.logout(); 
        $location.path('/'); 
        hideModal();
        $route.reload();
      }, 1000);
    }

  };

  /*
  * Renew Session
  */
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


  /*
  * End Session
  */
  app.endSession = function() {
    app.choiceMade = true;
    app.checkingSession = false;
    hideModal();
    $timeout(function() {
      showModal(PROMPT_LOGOUT_MODAL);  
    }, 500);
  };

  /*
  * Hide Modal
  */
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
      app.checkingSession = false;
      app.isLoggedIn = false;
      app.username = "";
      app.useremail = "";
      app.loadme = true;
      Auth.logout(); // Logout user
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
});