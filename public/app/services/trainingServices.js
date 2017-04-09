angular.module('trainingServices', [])

  .factory('TrainingModule', function($http) {
  
  
  var trainingFactory = {}; // Create the User object

  trainingFactory.getTrainingModule = function(id) {
    return $http.get('/api/trainingmodule/' + id);         
  };


  return trainingFactory;
});



