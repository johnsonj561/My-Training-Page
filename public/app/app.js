angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'trainingServices', 'ngAnimate', 'mainController', 'authServices', 'emailController', 
                           'managementController', 'menuController', 'trainController', 'reportController', 'ngSanitize'])

.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptors');
});