angular.module('trainController', ['trainingServices'])

  .controller('trainCtrl', function(TrainingModule, $location) {

  app = this;  


  // get list of training modules registered to current user
  // display in drop down menu for selection ?
  // when selected, submit the training module _id to server and return the training module

  var training_id =  '58e917e69d5382072055aa8c';
  app.component = {};

  // display training module to user
  TrainingModule.getTrainingModule(training_id).then(function(data) {
    // if data exists, bind to view
    if(data) {

      // get generic training module info to display to user
      app.title = data.data.trainingmodule.name;
      app.author = data.data.trainingmodule.author[0].name;
      app.lastEdit = new Date(data.data.trainingmodule.last_edit).toDateString();

      // get the list of components for training module
      app.components = data.data.trainingmodule.components;

      // get the first training component from the training module
      app.component = data.data.trainingmodule.components[0];

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
      if(app.component.page < app.components.length) {
        // note - we are not adding 1 to component.page because it is based on index 1
        // and the components array is based on index 0
        app.component = app.components[app.component.page];
        console.log('page incremented to ' + app.component.page);
        console.log('new component data is' + JSON.stringify(app.component));
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
      if(app.component.page > 1) {
        // note - we decrement 2 to move 1 page down because component.page is based on index 1
        app.component = app.components[app.component.page - 2];
        console.log('page decremented to ' + app.component.page);
        console.log('new component data is' + JSON.stringify(app.component));
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