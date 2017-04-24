angular.module('menuController', ['userServices', 'authServices'])

// Controller: emailCtrl is used to activate the user's account    
  .controller('menuCtrl', function(User, Auth) {

  app = this;
  app.displayProgressBar = true;

  /*
  * Get user's completion rate and set progress bar
  */
  User.getCompletionRate().then(function(data) {
    if(data.data.success) {
      app.completionRate = data.data.completionRate;
      $('div.progress-bar').width(app.completionRate + '%');
      if(app.completionRate == 100){
        app.progressBarMessage = 'Congrats, you are currently up to date on training.';
      }
      else if(app.completionRate > 80) {
        app.progressBarMessage = 'You are doing well, almost all caught up!';
      }
      else if(app.completionRate > 50) {
        app.progressBarMessage = 'You\'ve got some work to do!';
      }
      else if(app.completionRate > 10) {
        app.progressBarMessage = 'Time to get busy, you are starting to fall behind!';
      }
      else {
        app.progressBarMessage = 'Dude - what are you doing with your life!?';
      }
    }
    else {
      // error calculating completion rate, hide the progress bar
      app.displayProgressBar = false;
    }
  });
  
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