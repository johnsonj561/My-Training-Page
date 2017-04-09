var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/*
* Training Module Schema
*/
var TrainingModuleSchema = new Schema({
  name: { type: String, required: true },
  author: {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: {type: String, required: true }
  },
  last_edit: { type : Date, required: true, default: Date.now },
  components: {type: Array, required: true },
  assignedCount: { type: Number, required: true, default: 0 },
  completedCount: { type: Number, required: true, default: 0 },
  totlaScores: { type: Number, required: true, default: 0 },
  lowScore: { type: Number, required: true, default: 0 },
  highScore: { type: Number, required: true, default: 0 }
}, {collection: 'training'});


module.exports = mongoose.model('TrainingModule', TrainingModuleSchema);