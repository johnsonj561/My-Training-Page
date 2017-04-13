angular.module('trainController', ['trainingServices'])

  .controller('trainCtrl', function(TrainingModule, $location, $scope) {

  app = this;  


  /*
  * Load Media
  * Checks component for media type and loads into source
  */
  app.loadMedia = function(component) {
    if(component.pageType == 'video') {
      console.log('video type detected');
      app.component.source = component.video;
    }
    else if(component.pageType == 'audio') {
      console.log('audio type detected');
      app.component.source = component.audio;
    }
  }

  /*
  * Is Media returns true if component contains video/audio sources
  */
  app.isMedia = function(component) {
    if(component.pageType == 'video' || component.pageType == 'audio') {
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
  }


  /*
  * Grade Components
  * Traverses all components and checks user's submissions
  * Returns Number grade
  */
  app.gradeComponents = function(components) { 

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
        console.log('solution: ' + components[i].solution);
        console.log('submission: ' + components[i].submission);
        if(components[i].solution === components[i].submission) {
          correct++;
        }
      }
    }
    alert( (correct/count)*100 + '%' );
  }


  // get list of training modules registered to current user
  // display in drop down menu for selection ?
  // when selected, submit the training module _id to server and return the training module

  var training_id2 =  '58ed9857990c04dee6dbd859';
  var training_id = '58ed986c990c04dee6dbd85a';

  app.component = {};

  // display training module to user
  TrainingModule.getTrainingModule(training_id).then(function(data) {
    // if data exists, bind to view
    if(data) {
      console.log(data);
      // get generic training module info to display to user
      app.title = data.data.trainingmodule.name;
      app.author = data.data.trainingmodule.author[0].name;
      app.lastEdit = new Date(data.data.trainingmodule.lastEdit).toDateString();

      // get the list of components for training module
      app.components = data.data.trainingmodule.components;

      // set the page index to 0, always start on first component
      app.page = 0;

      // get the first training component from the training module
      app.component = data.data.trainingmodule.components[app.page];

      // if training component is a question, hide the next button
      if(app.isQuestion(app.component)) {
        app.hideNext = true;
      }

    }
    // if error occurs, render error message and re-direct to menu
    else {
      app.title = 'An Error Occurred, Redirecting...';
      $timeout(function() {
        $location.path('/menu');
        $route.reload();
      }, 2000);
    }
  });


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
            console.log('before changing page, storing: ' + app.submission);
            app.component.submission = app.submission;
          }
          else {
            console.log('no change was made, no new value to store');
          }

          // setting app.submission to undefined before getting next page
          app.submission = undefined;
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
            console.log('restoring value from memory: ' + app.component.submission);
            app.submission = app.component.submission;
          }
          // else no answer exists, hide next button
          else {
            app.hideNext = true;
          }
        }
      }
    }
    // else page is not defined we have an error
    else {
      console.log('an error occurred incrementing the page');
    }
  }


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
            console.log('before changing page, storing: ' + app.submission);
            app.component.submission = app.submission;
          }
          // else if no new submission but an old answer exists
          else {
            console.log('no change was made, no new value to store');
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
            console.log('restoring value from memory: ' + app.component.submission);
            app.submission = app.component.submission;
          }
          // else no answer exists, hide next button
          else {
            app.hideNext = true;
          }

        }
      }
    }
    // else page is not defined we have an error
    else {
      console.log('an error occurred decrementing the page');
    }
  }



  // allow user to complete training module

  // on completion/validation, update trainingmodule and user models with the results

  // return user to main menu


})

.controller('assignTrainingCtrl', function(TrainingModule, $location) {
  
  var app = this;
  
  /*
  * Select Module accepts training module id as parameter
  * Stores the id for future reference
  * Sets flags to hide training modules and display Users for selection process
  */
  app.selectModule = function(id) {
    app.moduleSelected = true;
    app.selectedTrainingId = id;
    console.log(app.selectedTrainingId + ' has been stored');
  }
  
  /*
  * Get all available training modules
  */
  TrainingModule.getTrainingModules().then(function(data) {
    // if training modules were found
    if(data) {
      
      // bind module data to view
      app.modules = data.data.modules; 
     
      // format the date
      for(var i = 0; i < app.modules.length; i++) {
        var edit = new Date(app.modules[i].lastEdit);
        app.modules[i].lastEdit = (edit.getMonth()+1) + '/' + (edit.getDay()) + '/' + (edit.getFullYear());
      }
      
    }
    // if error occurs, render error message and re-direct to menu
    else {
      app.title = 'An Error Occurred, Redirecting...';
      $timeout(function() {
        $location.path('/menu');
        $route.reload();
      }, 2000);
    }
  });


});
