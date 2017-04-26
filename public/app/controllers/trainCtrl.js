angular.module('trainController', ['trainingServices', 'userServices', 'ngSanitize'])

  .controller('trainCtrl', function(TrainingModule, $location, User, $sce) {

  var app = this;  
  app.user = {};
  app.components = {};
  app.assignments = {};
  app.test = 'hello';
  app.viewCompleted = true;
  
  app.loading = true;
  
  /*
  * Get the Training Modules associated with current user
  */
  User.getCurrentUser().then(function(data) {
    if(data.data.success) {
      app.user._id = data.data.user._id;
      TrainingModule.getUserTraining(app.user._id).then(function(data) {
        if(data.data.success) {
          app.assignments = data.data.assignments[0].assignments;
          // format the dates
          for(var i = 0; i < app.assignments.length; i++) {
            if(app.assignments[i].module.completionDate) {
              var edit = new Date(app.assignments[i].module.completionDate);
              app.assignments[i].module.completionDate = (edit.getMonth()+1) + '/' + (edit.getDate()) + '/' + (edit.getFullYear());
            }
          }
          
          // data gathered, remove loading icon
          app.loading = false;
          
          if(app.assignments.length == 0) {
            app.errorMsg = "You don't have any training assignments to complete at this time.";  
          }
        }
        else {
          app.loading = false;
          app.errorMsg = data.data.message;
        }
      });
    }
    else {
      app.loading = false;
      app.errorMsg = data.data.message;
    }
  });

  /*
  * Toggle Completed Display
  * Enables/disables the completed training module views
  * Allows user to determine whether or not they can see the completed training modules
  */
  app.toggleCompleted = function() {
    // if completed are visible
    if(app.viewCompleted) {
      app.viewCompleted = false;
      $("button#view-completed-btn").text("Show Completed");
    }
    else {
      app.viewCompleted = true;
      $("button#view-completed-btn").text("Hide Completed");
    }
  };


  /*
  * Search accepts keyword(s) and applies filter to results
  */
  app.search = function(searchKeyword) {
    // Check if a search keyword was provided
    if (searchKeyword) {
      // Check if the search keyword actually exists
      if (searchKeyword.length > 0) {
        app.searchFilter = searchKeyword; // Set the search filter to the word provided by the user
      } else {
        app.searchFilter = undefined; // Remove any keywords from filter
      }
    } else {
      app.searchFilter = undefined; // Reset
    }
  };


  /*
  * Clear removes filter from results and clears 
  */
  app.clear = function() {
    app.searchKeyword = undefined; // Clear the search word
    app.searchFilter = undefined; // Clear the search filter
  };

})


/*
* Complete Training Controller
* Controller that handles training course completion and grading
*/
  .controller('completeTrainingCtrl', function(TrainingModule, User, $location, $routeParams, $timeout) {

  var app = this;

  app = this;  
  app.errorMsg = false;
  app.successMsg = false;
  app.loading = false;
  app.user = {};
  app.module = {};

  /*
  * Get the current user
  */
  User.getCurrentUser().then(function(data) {
    if(data.data.success) {
      app.loading = false;
      app.user._id = data.data.user._id;
    }
    else {
      app.errorMsg = data.data.message;
      $timeout(function() {
        $location.path('/menu');
      }, 1500);
    }
  });


  /*
  * Get Training Module that has training module id
  */
  TrainingModule.getTrainingModule($routeParams.id).then(function(data) {
    app.loading = true;
    app.errorMsg = false;
    app.successMsg = false;
    // if module returned success
    if(data.data.success) {
      app.loading = false;
      // get generic training module info to display to user
      app.module = data.data.trainingmodule;
      app.title = data.data.trainingmodule.name;
      app.author = data.data.trainingmodule.author[0].name;
      app.lastEdit = new Date(data.data.trainingmodule.lastEdit).toDateString();

      // get the list of components for training module
      app.components = data.data.trainingmodule.components;

      // set the page index to 0, always start on first component
      app.page = 0;

      // get the first training component from the training module
      app.component = data.data.trainingmodule.components[app.page];

      // check for media file and load source
      if(app.isMedia(app.component)) {
        app.loadMedia(app.component);
      }

      // if training component is a question, hide the next button
      if(app.isQuestion(app.component)) {
        app.hideNext = true;
      }
    }
    // if error occurs, render error message and re-direct to menu
    else {
      app.loading = false;
      app.errorMsg = data.data.message;
      $timeout(function() {
        $location.path('/menu');
        $route.reload();
      }, 2000);
    }
  });


  /*
  * Show Modal Function displays the training module score to the user
  */
  var showModal = function(score) {
    // modal title
    app.modalHeader = 'Training Module Complete!';
    // build modal body based off score
    if(score > 90) {
      app.modalBody = 'Congratulations! You scored a ' + score + '%. Keep up the good work!';
    }
    else if(score > 75) {
      app.modalBody = 'You scored a ' + score + '%. Feel free to re-test if you want to get a higher score.';
    }
    else {
      app.modalBody = 'You finished the course, but only scored a ' + score + '%. You should consider trying again.';
    }
    // display modal
    $('#myModal').modal({ backdrop: 'static' });
  }
  /*
  * Return to user menu
  */
  app.returnToMenu = function() {
    $location.path('/menu');
  }


  /*
  * Load Media
  * Checks component for media type and loads into source
  */
  app.loadMedia = function(component) {
    if(component.pageType == 'video') {
      app.component.source = component.video;
    }
    else if(component.pageType == 'audio') {
      app.component.source = component.audio;
    } 
    else if(component.pageType == 'image') {
      app.component.source = component.image;
    }
  }

  /*
  * Is Media returns true if component contains video/audio sources
  */
  app.isMedia = function(component) {
    if(component.pageType == 'video' || 
       component.pageType == 'audio' || component.pageType == 'image') {
      return true;
    }
    return false;
  }

  /* 
  * Is Question returns true if component contains true-false or multiple-choice values
  */
  app.isQuestion = function(component) {
    if(component.pageType == 'true-false' || component.pageType == 'multiple-choice') {
      return true;
    }
    return false;
  };

  app.pauseMedia = function(component) {
    if(component.pageType == 'video') {
      document.getElementById('video-component').pause();
    }
    else if(component.pageType == 'audio') {
      document.getElementById('audio-component').pause();
    }
  };

  /*
  * Grade Components
  * Traverses all components and checks user's submissions
  * Returns Number grade
  */
  app.gradeComponents = function(components) { 

    app.loading = true;

    // make sure the last page's question has been saved before calculating
    if(app.isQuestion(app.component)) {
      // if a new submission was made
      if(app.submission !== app.component.submission) {
        app.component.submission = app.submission;
      }
    }
    var count = 0;
    var correct = 0;
    for(var i = 0; i < components.length; i++) {
      // if the component is a question, process grade
      if(app.isQuestion(components[i])) {
        count++;
        if(components[i].solution === components[i].submission) {
          correct++;
        }
      }
    }

    var score = Math.ceil(((correct/count)*100));

    // object that contains new data to update db
    var trainingData = {};
    trainingData.module = app.module;
    trainingData.user = app.user._id;
    trainingData.module.score = score;

    /* 
    * Update the user's assignments with new data
    * First - get the  old assignment score, and if > -1, mark difference
    * Then update user's corresponding assignment subdocument
    * Then update the trainig module's stats
    */
    TrainingModule.getUserTraining(trainingData.user).then(function(data) {
      // if user assignments were found, get assignment score and calculate score difference
      if(data.data.success) {
        var assignments = data.data.assignments[0].assignments;
        var oldScore = findOldScore(assignments, trainingData.module._id);
        trainingData.isRetake = false;
        if(oldScore > -1) {
          trainingData.scoreDifference = score - oldScore;
          trainingData.isRetake = true;
        }

        // update user's assignment subdocument
        updateUserAssignmentScore(trainingData);

        // update training module with new scores
        updateTrainingModuleData(trainingData);

        // display score
        showModal(score);

      }
    });
  };


  /*
  * Traverses array of assignments and returns the score to assignment with ID
  */
  var findOldScore = function(assignments, module) {
    for(var i = 0; i < assignments.length; i++) {
      if(assignments[i].module._id == module) {
        return assignments[i].module.score;
      }
    }
    return null;
  };


  /* 
  * Update training module data with new score
  */
  var updateTrainingModuleData = function(trainingData) {
    console.log('in updateTrainingModuleData');
    TrainingModule.updateScores(trainingData).then(function(data) {
      if(data.data.success) {
        console.log('training module updated');
      }
      else {
        console.log('Training module not updated with new scores, an error occurred');
      }  
    });
  };


  /*
  * Update user's assignment subdocument with new score
  */
  var updateUserAssignmentScore = function(trainingData) {
    console.log('in updateUserAssignmentScore');
    // now we update database with trainingData
    // update the user document
    User.storeTrainingScore(trainingData).then(function(data) {
      if(data.data.success) {
        console.log('user assignment score updated');
      }
      else {
        console.log('unable to update user\'s assignment score');
      }          
    });
  };


  /*
  * Update Training Module with new scores
  */
  var updateTrainingModuleData = function(trainingData) {
    TrainingModule.updateScores(trainingData).then(function(data) {
      if(data.data.success) {
        console.log('update scores success' + data);
      }
      else {
        console.log('error updating scores');
      }
    });
  };


  /*
  * Next Page
  * Stores current page data
  * Retrieves next page and pre-processes data for rendering
  */
  this.nextPage = function($scope) {
    // if components are defined
    if(app.components) {
      if(app.page < app.components.length) {

        // if current component is a question
        if(app.isQuestion(app.component)) {
          // if a new submission was made
          if(app.submission !== app.component.submission) {
            app.component.submission = app.submission;
          }

          // setting app.submission to undefined before getting next page
          app.submission = undefined;
        }
        // else if current component is audio/video, pause it before changing page
        else if(app.isMedia(app.component)) {
          app.pauseMedia(app.component);
        }

        // get next component from components array
        app.page += 1;
        app.component = app.components[app.page];
        app.hideNext = false;

        // check for media file and load source
        if(app.isMedia(app.component)) {
          app.loadMedia(app.component);
        }

        // check if questions was answered once already
        // restore previous value if true
        if(app.isQuestion(app.component)) {
          // if a submission is defined from previous view, restore it
          if(app.component.submission !== undefined) {
            app.submission = app.component.submission;
          }
          // else no answer exists, hide next button
          else {
            app.hideNext = true;
          }
        }
      }
    }
  };

  /*
  * Previous Page function decrements app.page
  */
  this.previousPage = function() {
    // if components are defined
    if(app.components) {
      if(app.page > 0) {

        // if current component is a question
        if(app.isQuestion(app.component)) {
          // if a new submission was given
          if(app.submission !== app.component.submission) {
            app.component.submission = app.submission;
          }
          // reset submission model before getting next component
          app.submission = undefined;
        }

        // get previous component from components array
        app.page -= 1;
        app.component = app.components[app.page];
        app.hideNext = false;

        // check for media file and load source
        if(app.isMedia(app.component)) {
          app.loadMedia(app.component);
        }

        // check if questions was answered once already
        // restore previous value if true
        if(app.isQuestion(app.component)) {
          // if a submission is defined from previous view, restore it
          if(app.component.submission !== undefined) {
            app.submission = app.component.submission;
          }
          // else no answer exists, hide next button
          else {
            app.hideNext = true;
          }

        }
      }
    }
  };

  
})


  .controller('assignTrainingCtrl', function(TrainingModule, User, $location, $timeout) {

  var app = this;

  app.selectedUsers = [];
  app.selectedModule = undefined;
  app.modules = undefined;
  app.users = undefined;
  app.submitDisabled = true;
  app.successMsg = false;
  app.errorMsg = false;
  app.loading = false;

  var today = new Date();


  /*
  * Select Module accepts training module index as parameter
  * Uses the index to store the selected module for future use
  * Sets flags to hide training modules and display Users for selection process
  */
  app.selectModule = function(idx) {
    // store the selected module
    app.moduleSelected = true;
    app.selectedModule = app.modules[idx];
    // then get the users to display for selection
    // we should pass the training module id and not get users that are already assigned
    User.getUsersToTrain(app.selectedModule._id).then(function(data){
      app.users = data.data.users;
    });
  };

  /*
  * Toggle User Selection
  * Handles user selection on the training module assignment view
  * Builds array of selected users by binding to check boxes
  */
  app.toggleUserSelection = function (user) {
    var idx = app.selectedUsers.indexOf(user);
    if(idx > -1 ) {
      app.selectedUsers.splice(idx, 1);
    }
    else {
      app.selectedUsers.push(user);
    }
    if(app.selectedUsers.length > 0) {
      app.submitDisabled = false;
    }
    else {
      app.submitDisabled = true;
    }
  };

  /*
  * Submit Training Assignment
  * Adds Training Module to each user that has been selected for training
  * Pushes training module onto assignments array of user schema
  */
  app.submitAssignment = function() {
    app.submitDisabled = true;
    app.successMsg = false;
    app.errorMsg = false;
    app.loading = true;
    // for each user._id, push an assignment into their db
    // we will append the users array to the selectedModule data and send together
    var assignmentData = {};
    assignmentData.selectedUsers = app.selectedUsers;
    assignmentData.selectedModule = app.selectedModule;
    // need module._id, module.title, and module.description
    TrainingModule.assignTraining(assignmentData).then(function(data) {
      if(data.data.success) {
        app.loading = false;
        app.successMsg = data.data.message;
        $timeout(function() {
          $location.path('/menu');
        }, 2000);
      }
      else {
        app.loading = false;
        app.errorMsg = data.data.message;
        $timeout(function() {
          $location.path('/menu');
        }, 2000);
      }
    });
  }



  /*
  * Search accepts keyword(s) and applies filter to results
  */
  app.search = function(searchKeyword) {
    // Check if a search keyword was provided
    if (searchKeyword) {
      // Check if the search keyword actually exists
      if (searchKeyword.length > 0) {
        app.searchFilter = searchKeyword; // Set the search filter to the word provided by the user
      } else {
        app.searchFilter = undefined; // Remove any keywords from filter
      }
    } else {
      app.searchFilter = undefined; // Reset
    }
  };


  /*
  * Clear removes filter from results and clears 
  */
  app.clear = function() {
    app.searchKeyword = undefined; // Clear the search word
    app.searchFilter = undefined; // Clear the search filter
  };


  /*
  * Get all available training modules
  */
  TrainingModule.getTrainingModules().then(function(data) {
    app.loading = true;
    app.errorMsg = false;
    app.successMsg = false;
    // if training modules were found
    if(data.data.success) {
      // bind module data to view
      app.modules = data.data.modules; 
      // format the date
      for(var i = 0; i < app.modules.length; i++) {
        var edit = new Date(app.modules[i].lastEdit);
        app.modules[i].lastEdit = (edit.getMonth()+1) + '/' + (edit.getDate()) + '/' + (edit.getFullYear());
      }
      app.loading = false;
    }
    else {
      app.loading = false;
      app.errorMsg = data.data.message;
    }
  });


});
