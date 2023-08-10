const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: String,
  author: String,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
});

const Comment =  new mongoose.model("Comment", commentSchema);

module.exports = { Comment };