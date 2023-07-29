const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const { Post } = require(__dirname + "/postSchema.js");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  Post.find({})
    .then(function (posts) {
      res.render("home", { title: "Homepage", posts });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/compose", function (req, res) {
  res.render("compose", { title: "Compose" });
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postContent,
  });
  post
    .save()
    .then(function (data) {
      if (data) {
        res.redirect("/");
      } else {
        res.redirect("/compose");
      }
    })
    .catch(function (err) {
      res.status(404).send(err);
    });
});

app.get("/posts/:postID", function (req, res) {
  const requestedPostID = req.params.postID;
  Post.findOne({ _id: requestedPostID })
    .then(function (post) {
      res.render("post", { title: post.title, content: post.content });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.listen(port, function () {
  console.log("Server running on port " + port);
});
