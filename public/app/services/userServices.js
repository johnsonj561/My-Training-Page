angular.module('userServices', [])

.factory('User', function($http) {
  var userFactory = {}; // Create the User object

  userFactory.create = function(regData) {
    return $http.post('/api/users', regData); // Return data from end point to controller
  };

  //User.checkUsername(regData);
  userFactory.checkUsername = function(regData) {
    return $http.post('/api/checkusername', regData); // Return data from end point to controller
  };

  //User.checkEmail(regData);
  userFactory.checkEmail = function(regData) {
    return $http.post('/api/checkemail', regData); // Return data from end point to controller
  };

  userFactory.activateAccount = function(token) {
    return $http.put('/api/activate/' + token);  
  };

  userFactory.checkCredentials = function(loginData) {
    return $http.post('/api/resend', loginData);
  };

  userFactory.resendLink = function(username) {
    return $http.put('/api/resend', username)
  };

  // User.sendUsername(userData);
  userFactory.sendUsername = function(userData) {
    return $http.get('/api/resetusername/' + userData);
  };

  // User.sendPassword(resetData)
  userFactory.sendPassword = function(resetData) {
    return $http.put('/api/resetpassword', resetData);  
  };

  // User.resetUser(token);
  userFactory.resetUser = function(token) {
    return $http.get('/resetpassword/' + token);  
  };

  // User.savePassword(regData)
  userFactory.savePassword = function(regData) {
    return $http.put('/api/savepassword', regData)  
  };

  userFactory.renewSession = function(username) {
    return $http.get('/api/renewToken/' + username);  
  };

  userFactory.getPermission = function() {
    return $http.get('/api/permission/');  
  };

  userFactory.getUsers = function() {
    return $http.get('/api/management/');
  };
  
  userFactory.getUser = function(id) {
    return $http.get('/api/edit/' + id);  
  };
  
  userFactory.deleteUser = function(username) {
    return $http.delete('/api/management/' + username);  
  };
  
  userFactory.editUser = function(id) {
    return $http.put('/api/edit/', id);
  };
  
  return userFactory;
});



