angular.module('menuController', ['userServices', 'authServices'])

// Controller: emailCtrl is used to activate the user's account    
  .controller('menuCtrl', function(User, Auth) {

  app = this;
  app.displayProgressBar = true;


  /*
  * Get permission of current user
  */
  User.getPermission().then(function(data) {
    if(data.data.success) {
      app.permission = data.data.permission;
      if(app.permission === 'user') {
        app.displayProgressBar = true;
      }
    }
    else {
      app.permission = false;
    }
  });

  /*
  * Verify that user is logged in
  */
  app.isLoggedIn = function() {
    return Auth.isLoggedIn();
  }
  
  /*
  * Return true if current user is admin
  */
  app.isAdmin = function() {
    if(app.permission === 'admin') {
      return true;
    }
    return false;
  }



});