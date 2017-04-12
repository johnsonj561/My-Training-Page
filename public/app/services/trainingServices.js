angular.module('trainingServices', [])

  .factory('TrainingModule', function($http) {
  
  
  var trainingFactory = {}; // Create the User object

  // get the training module with given id
  trainingFactory.getTrainingModule = function(id) {
    return $http.get('/api/trainingmodule/' + id);         
  };
  
  // get the training modules assigned to user with id
  trainingFactory.getUserTraining = function(id) {
    return $http.get('/api/usertraining/' + id);
  };


  return trainingFactory;
});



