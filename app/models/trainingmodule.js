var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/*
* Individual Training Component Schema
* No specific format is required to allow user to choose between various component types
CURRENTLY NOT BEING USED
var TrainingComponent = new Schema({
  pageType : { type: String, required: true },
  title: { type: String, required: false },
  body: { type: String, required: false },
  video: { type: String, required: false },
  audio: { type: String, required: false },
  description: { type: String, required: false },
  question: { type: String, required: false },
  answer: { type: Number, required: false }
});

*/



/*
* Training Module Schema
*/
var TrainingModuleSchema = new Schema({
  name: { type: String, required: true },
  author: { type: Array, required: true},
  lastEdit: { type : Date, required: true, default: Date.now },
  components: {type: Array, required: true },
  assignedCount: { type: Number, required: true, default: 0 },
  completedCount: { type: Number, required: true, default: 0 },
  totalScores: { type: Number, required: true, default: 0 },
  lowScore: { type: Number, required: true, default: 0 },
  highScore: { type: Number, required: true, default: 0 }
}, {collection: 'trainingmodules'});


module.exports = mongoose.model('TrainingModule', TrainingModuleSchema);