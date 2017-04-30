angular.module('reportController', ['trainingServices'])

// Controller: emailCtrl is used to activate the user's account    
  .controller('reportCtrl', function(TrainingModule) {

  app = this;
  app.loading = true;
  app.errorMsg = false;
  app.displaySummary = true;
  app.displayModule = false;

  // build graph data
  app.assignments = [];
  app.trainingModules = [];
  var colors = [];
  var percentage = [];
  var labels = []; 
  var assignmentCount = 0;
  var completedCount = 0;
  var totalScores = 0;
  var aCount = 0;
  var bCount = 0;
  var cCount = 0;
  var dCount = 0;
  var fCount = 0;

  TrainingModule.getUserTrainingByUsername().then(function(data) {
    if(data.data.success) {
      // map values to assignment array, count completed assignments
      app.assignments = data.data.assignments[0].assignments.map(function(x) {
        if(x.module.score > -1) {
          completedCount++;
          totalScores += x.module.score*1;
          if(x.module.score >= 90) aCount++;
          else if(x.module.score >= 80) bCount++;
          else if(x.module.score >= 70) cCount++;
          else if(x.module.score >= 65) dCount++;
          else fCount++;
        } 
        return x.module;
      });
      assignmentCount = app.assignments.length;
      for(var i = 0; i < assignmentCount; i++) {
        TrainingModule.getTrainingModule(app.assignments[i]._id).then(function(data) {
          app.trainingModules.push(data.data.trainingmodule);
        });
      }
      if(aCount) {
        app.aCount = aCount;
        percentage.push(((aCount/assignmentCount)*100).toFixed(1)*1);
        labels.push('A');
        colors.push('#A0D300');
      }
      if(bCount) {
        app.bCount = bCount;
        percentage.push(((bCount/assignmentCount)*100).toFixed(1)*1);
        labels.push('B');
        colors.push('#004CB0');
      }
      if(cCount) {
        app.cCount = cCount;
        percentage.push(((cCount/assignmentCount)*100).toFixed(1)*1);
        labels.push('C');
        colors.push('#FFCD00');
      }
      if(dCount) {
        app.dCount = dCount;
        percentage.push(((dCount/assignmentCount)*100).toFixed(1)*1);
        labels.push('D');
        colors.push('#FF7300');
      }
      if(fCount) {
        app.fCount = fCount;
        percentage.push(((fCount/assignmentCount)*100).toFixed(1)*1);
        labels.push('F');
        colors.push('#EC0033' );
      }
      if(completedCount < assignmentCount) {
        app.incompleteCount = assignmentCount - completedCount;
        percentage.push((((assignmentCount-completedCount)/assignmentCount)*100).toFixed(1)*1);
        labels.push('Incomplete');
        colors.push('#000000');
      }
      app.loading = false;
      app.assignmentCount = assignmentCount;
      app.completedCount = completedCount;
      app.incompleteCount = assignmentCount - completedCount;
      app.averageScore = ((totalScores/completedCount)).toFixed(1);
      drawGPAPieChart(percentage, labels, colors);

    }
    else {
      app.loading = false;
      app.errorMsg = 'We were unable to calculate your report at this time. Please try again later.'
    }
  });



  app.displayModuleStats = function(idx) {
    // verify assignments have been defined and index is within bounds
    if(app.assignments && idx >=0 && idx < app.assignments.length) {
      app.selectedModule = app.trainingModules[idx];
      app.userAssignment = app.assignments[idx];
      app.displaySummary = false;
      app.displayModule = true;
      drawModuleStatsGraph();
    }
    else {
      app.errorMsg = 'We were unable to populate training stats at this time, please try again later.';
    }
  };

  app.returnToSummary = function() {
    app.displayModule = false;
    app.displaySummary = true;
    RGraph.SVG.clear(app.barGraph.svg);
  }


  /*
  * Draw GPA Pie Chart
  * Displays User's Scoring Percentages
  */
  var drawGPAPieChart = function(data, labels, colors) {
    // data reflects overall percentage of grade
    // if user has 2 As, 1 B, and 1 C, data = 50, 25, 25
    //for (var i=0; i<data.length; ++i) {
    //labels[i] = labels[i] + ': ' + data[i] + '%';
    //}
    new RGraph.SVG.Pie({
      id: 'chart-container',
      data: data,
      options: {
        tooltips: labels,
        colors: colors,
        strokestyle: 'white',
        linewidth: 2,
        shadow: true,
        shadowOffsetx: 2,
        shadowOffsety: 2,
        shadowBlur: 3,
        exploded: 4
      }
    }).draw();
  };


  var drawModuleStatsGraph = function() {
    console.log(app.selectedModule);
    console.log(app.userAssignment);
    var classAverage = Math.round(app.selectedModule.totalScores/app.selectedModule.completedCount);
    var classLow = app.selectedModule.lowScore;
    var classHigh = app.selectedModule.highScore;
    var userScore = app.userAssignment.score;
    var userScoreColor;
    if(userScore >= 90) userScoreColor = '#A0D300';
    else if(userScore >= 80) userScoreColor = '#004CB0';
    else if(userScore >= 70) userScoreColor ='#FFCD00';
    else if(userScore >= 65) userScoreColor = '#FF7300';
    else userScoreColor = '#EC0033';
    console.log('classAverage, classLow, classHigh, userScore', classAverage, classLow, classHigh, userScore);
    
    app.barGraph = new RGraph.SVG.HBar({
      id: 'bar-graph-container',
      data: [userScore, classAverage, classLow, classHigh],
      options: {
        backgroundGrid: true,
        backgroundGridHlines: false,
        xaxisMax: 100,
        xaxisLabelsCount: 10,
        xaxis: false,
        xaxisScale: false,
        colors: [userScoreColor,'#004CB0','#FF7300','#A0D300',],
        colorsSequential: true,
        yaxisLabels: ['Your Score','Group Average','Group Low','Group High'],
        labelsAbove: true,
        labelsAbovePost: '%',
        yaxisTickmarks: false
      }
    }).wave();
  };
});