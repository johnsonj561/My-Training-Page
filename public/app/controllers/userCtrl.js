angular.module('userControllers', ['userServices'])

.controller('regCtrl', function($http, $location, $timeout, User, $route, $window) {

  var app = this;

  // Function to submit form and register account
  app.regUser = function(regData, valid) {
    app.loading = true; // To activate spinning loading icon w/bootstrap
    app.errorMsg = false; // Clear error message each time the user presses submit
    app.successMsg = false; // Clear success message each time user presses submit
    app.disabled = true;
    
    // only process if front end was valid
    if(valid) {
      // Initiate service to save the user into the dabase            
      User.create(app.regData).then(function(data) {
        if (data.data.success) {
          app.loading = false; // Once data is retrieved, loading icon should be cleared
          app.successMsg = data.data.message + '...Redirecting'; // Create Success Message
          // Redirect to home page after 2000 miliseconds
          $timeout(function() {
            $location.path('/');
            $route.reload();
          }, 2000);
        } else {
          app.disabled = false;
          app.loading = false; // Once data is retrieved, loading icon should be cleared
          app.errorMsg = data.data.message; // Create an error message
        }
      });
    }
    else {
      app.disabled = false;
      app.loading = false;
      app.errorMsg = 'Please ensure form is filled out properly.';
    }
  };

  this.checkUsername = function(regData) {
    app.checkingUsername = true;
    app.usernameMsg = false;
    app.usernameInvalid = false;
    User.checkUsername(app.regData).then(function(data) {
      if (data.data.success) {
        app.checkingUsername = false;
        app.usernameMsg = data.data.message;
        app.usernameInvalid = false;
      }
      else {
        app.checkingUsername = false;
        app.usernameInvalid = true;
        app.usernameMsg = data.data.message;
      }
    });
  }

  this.checkEmail = function(regData) {
    app.checkingEmail = true;
    app.emailMsg = false;
    app.emailInvalid = false;
    User.checkEmail(app.regData).then(function(data) {
      if (data.data.success) {
        app.checkingEmail = false;
        app.emailInvalid = false;
        app.emailMsg = data.data.message;
      }
      else {
        app.checkingEmail = false;
        app.emailInvalid = true;
        app.emailMsg = data.data.message;
      }
    });
  }
})


// custom angular directive
// https://docs.angularjs.org/guide/directive
.directive('match', function() {
  return {
    restrict: 'A',
    controller: function($scope) {
      $scope.confirmed = false;
      $scope.doConfirm = function(values) {
        values.forEach(function(ele) {
          if($scope.confirm == ele) {
            $scope.confirmed = true;
          }
          else {
            $scope.confirmed = false;
          }
        });
      }
    },

    link: function(scope, element, attrs) {
      attrs.$observe('match', function() {
        scope.matches = JSON.parse(attrs.match);
        scope.doConfirm(scope.matches);  
      });

      scope.$watch('confirm', function() {
        scope.matches = JSON.parse(attrs.match);
        scope.doConfirm(scope.matches);
      });

    }
  };
})

.controller('facebookCtrl', function($routeParams, Auth, $location, $window) {
  var app = this;
  app.errorMsg = false;
  app.disabled = true;

  if($window.location.pathname == '/facebookerror') {
    app.errorMsg = 'Facebook email not found in database';
  }
  else if($window.location.pathname == '/facebook/inactive/error') {
    app.expired = true;
    app.errorMsg = 'Account is not yet actived. Please check your email for activation link.';
  }
  else {
    Auth.facebook($routeParams.token);
    $location.path('/');
  }

})


.controller('googleCtrl', function($routeParams, Auth, $location, $window) {
  var app = this;
  app.errorMsg = false;
  app.disabled = true;

  if($window.location.pathname == '/googleerror') {
    app.errorMsg = 'Google email not found in database';
  }
  else if($window.location.pathname == '/google/inactive/error') {
    app.expired = true;
    app.errorMsg = 'Account is not yet actived. Please check your email for activation link.';  
  }
  else {
    Auth.facebook($routeParams.token);
    $location.path('/');
  }

});
