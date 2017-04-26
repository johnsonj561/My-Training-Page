angular.module('authServices', [])

.factory('Auth', function($http, AuthToken) {
  var authFactory = {}; // Create the Auth object

  authFactory.login = function(loginData) {
    return $http.post('/api/authenticate', loginData).then(function(data) {
      AuthToken.setToken(data.data.token);
      return data;
    }); // Return data from end point to controller
  };

  authFactory.isLoggedIn = function() {
    if(AuthToken.getToken()) {
      return true;
    }
    else {
      return false;
    }
  };

  authFactory.facebook = function(token) {
    AuthToken.setToken(token);  
    
  };

  authFactory.getUser = function() {
    if(AuthToken.getToken()) {
      return $http.post('/api/me');  
    }
    else{
      $q.reject({ message: 'User has no token' });  
    }
  };

  authFactory.logout = function() {
    console.log('Auth Logout()');
    AuthToken.setToken();
  };

  return authFactory;
})

.factory('AuthToken', function($window) {
  var authTokenFactory = {};

  authTokenFactory.setToken = function(token) {
    if(token) {
      window.localStorage.setItem('token', token);  
    }
    else{
      window.localStorage.removeItem('token');  
    }

  };

  authTokenFactory.getToken = function() {
    return $window.localStorage.getItem('token');
  };

  return authTokenFactory;

})


.factory('AuthInterceptors', function(AuthToken) {
  var authInterceptorsFactory = {};
  authInterceptorsFactory.request = function(config) {
    var token = AuthToken.getToken();
    if(token) {
      config.headers['x-access-token'] = token;  
    }
    return config;
  };
  return authInterceptorsFactory;
});



