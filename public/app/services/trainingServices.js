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

  // get all training modules available to admin
  trainingFactory.getTrainingModules = function() {
    return $http.get('/api/alltraining');
  }
  
  // assign training module to users
  trainingFactory.assignTraining = function(assignmentData) {
    return $http.put('/api/assignTraining', assignmentData);
  }
  
  // update the training module stats with new training scores
  trainingFactory.updateScores = function(trainingData) {
    return $http.put('/api/updateScores', trainingData);
  }

  return trainingFactory;
});



