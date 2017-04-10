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

  // get list of training modules registered to current user
  // display in drop down menu for selection ?
  // when selected, submit the training module _id to server and return the training module

  var training_id =  '58ead365f026bb6d79240594';

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
  * Next Page function incrememnts app.page
  */
  this.nextPage = function() {
    // if components are defined
    if(app.components) {
      if(app.page < app.components.length) {
        // get next component from components array
        app.page += 1;
        app.component = app.components[app.page];
        console.log('page incremented to ' + app.page);
        // check for media file and assign to scope
        app.loadMedia(app.component);
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
        app.page -= 1;
        // get previous component from components array
        app.component = app.components[app.page];
        console.log('page decremented to ' + app.page);
        // check for media file and assign to scope
        app.loadMedia(app.component);
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


});