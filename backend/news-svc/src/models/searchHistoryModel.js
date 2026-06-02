// backend/news-svc/src/models/searchHistoryModel.js
const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  query: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);