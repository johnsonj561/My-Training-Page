angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'emailController', 
                           'managementController', 'menuController'])

.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptors');
});