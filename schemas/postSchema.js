const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/blogDB");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }]
  },
  {
    timestamps: true,
  }
);

const Post = new mongoose.model("Post", postSchema);

module.exports = { Post };
