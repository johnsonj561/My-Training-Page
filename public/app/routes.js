var app = angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

  $routeProvider // Create routes

  // Home Route    
  .when('/', {
    templateUrl: 'app/views/pages/home.html',

  })


  // Register Route            
  .when('/register', {
    templateUrl: 'app/views/pages/users/register.html',
    controller: 'regCtrl',
    controllerAs: 'register',
    authenticated: false
  })

  // Login Route            
  .when('/login', {
    templateUrl: 'app/views/pages/users/login.html',
    authenticated: false
  })

  // Logout Route
  .when('/logout', {
    templateUrl: 'app/views/pages/users/logout.html',
    authenticated: true
  })

  // Use profile Route
  .when('/profile', {
    templateUrl: 'app/views/pages/users/profile.html',
    authenticated: true
  })
  
  .when('/editprofile', {
    templateUrl: 'app/views/pages/users/editprofile.html',
    controller: 'profileCtrl',
    controllerAs: 'profile',
    authenticated: true
  })

  .when('/facebook/:token', {
    templateUrl: 'app/views/pages/users/social/social.html',
    controller: 'facebookCtrl',
    controllerAs: 'facebook',
    authenticated: false
  })


  .when('/facebookerror', {
    templateUrl: 'app/views/pages/users/login.html',
    controller: 'facebookCtrl',
    controllerAs: 'facebook',
    authenticated: false
  })

  .when('/facebook/inactive/error', {
    templateUrl: 'app/views/pages/users/login.html',
    controller: 'facebookCtrl',
    controllerAs: 'facebook',
    authenticated: false
  })

  .when('/google/:token', {
    templateUrl: 'app/views/pages/users/social/social.html',
    controller: 'googleCtrl',
    controllerAs: 'google',
    authenticated: false
  })

  .when('/googleerror', {
    templateUrl: 'app/views/pages/users/login.html',
    controller: 'googleCtrl',
    controllerAs: 'google',
    authenticated: false
  })


  .when('/google/inactive/error', {
    templateUrl: 'app/views/pages/users/login.html',
    controller: 'googleCtrl',
    controllerAs: 'google',
    authenticated: false
  })


  .when('/activate/:token', {
    templateUrl: 'app/views/pages/users/activation/activate.html',
    controller: 'emailCtrl',
    controllerAs: 'email'
  })

  .when('/resend', {
    templateUrl: 'app/views/pages/users/activation/resend.html',
    controller: 'resendCtrl',
    controllerAs: 'resend'
  })

  .when('/resetusername', {
    templateUrl: 'app/views/pages/users/reset/username.html',
    controller: 'usernameCtrl',
    controllerAs: 'username',
    authenticated: false
  })

  .when('/resetpassword', {
    templateUrl: 'app/views/pages/users/reset/password.html',
    controller: 'passwordCtrl',
    controllerAs: 'password',
    authenticated: false
  })

  .when('/reset/:token', {
    templateUrl: 'app/views/pages/users/reset/newpassword.html',
    controller: 'resetCtrl',
    controllerAs: 'reset',
    authenticated: false
  })
  
  .when('/management', {
    templateUrl: 'app/views/pages/management/management.html',
    controller: 'managementCtrl',
    controllerAs: 'management',
    authenticated: true,
    permission: ['admin']
  })

    .when('/edit/:id', {
    templateUrl: 'app/views/pages/management/edit.html',
    controller: 'editCtrl',
    controllerAs: 'edit',
    authenticated: true,
    permission: ['admin']
  })
  
  .when('/search', {
    templateUrl: 'app/views/pages/management/search.html',
    controller: 'managementCtrl',
    controllerAs: 'management',
    authenticated: true,
    permission:['admin']
  })
  
  /*
  * User menu displays available functionality to user
  * Should be default view when user is logged in
  */
  .when('/menu', {
    templateUrl: 'app/views/pages/users/menu/menu.html',
    controller: 'menuCtrl',
    controllerAs: 'menu',
    authenticated: true
  })
  
  .when('/train', {
    templateUrl: 'app/views/pages/training/train.html',
    controller: 'trainCtrl',
    controllerAs: 'training',
    authenticated: true
  })
  
  
  // "catch all" to redirect to home page            
  .otherwise({ redirectTo: '/' });

  // Required for no base (remove '#' from address bar)
  $locationProvider.html5Mode({ enabled: true, requireBase: false });
});


// Handle user authentication errors
app.run(['$rootScope', 'Auth', '$location', 'User', function($rootScope, Auth, $location, User) {
  $rootScope.$on('$routeChangeStart', function(event, next, current) {

    if(next.$$route !== undefined) {

      if(next.$$route.authenticated == true) {
        if(!Auth.isLoggedIn()) {
          // prevent user from viewing page that requires authentication
          event.preventDefault();
          $location.path('/');
        }
        else if(next.$$route.permission) {

          User.getPermission().then(function(data) {

            if(next.$$route.permission[0] !== data.data.permission) {
              if(next.$$route.permission[1] !== data.data.permission) {
                event.preventDefault();
                $location.path('/');
              }
            }
          });
        }
      }

      else if(!next.$$route.authenticated == false) {
        if(Auth.isLoggedIn()) {
          event.preventDefault();
          $location.path('/profile');
        }
      };
    }
  })}]);