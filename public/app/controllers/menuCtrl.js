angular.module('menuController', ['userServices', 'authServices'])

// Controller: emailCtrl is used to activate the user's account    
  .controller('menuCtrl', function(User, Auth) {

  app = this;
  app.displayProgressBar = false;
  
  /*
  * Verify that user is logged in
  */
  app.isLoggedIn = Auth.isLoggedIn();
  
  /*
  * Get permission of current user
  * If current user is student, display progress bar
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
  


});