const session = require("express-session");
const express = require("express");
const app = express();
const ejs = require("ejs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bodyParser = require("body-parser");
const { Post } = require(__dirname + "/schemas/postSchema.js");
const { User } = require(__dirname + "/schemas/userSchema.js");
const { Comment } = require(__dirname + "/schemas/commentSchema.js");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your_secret_key_here",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("index", { title: "Personal Blog" });
});

app.get("/login", function (req, res) {
  res.render("login", { title: "Login" });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

app.get("/register", function (req, res) {
  res.render("register", { title: "Register" });
});

app.post("/register", async function (req, res) {
  try {
    const { username, password, password2, email } = req.body;
    if (password.length < 8 || password.length > 75) {
      return res.render("register", {
        title: "Register",
        error: "Password must be between 8 and 75 characters long",
      });
    }
    if (password !== password2) {
      return res.render("register", {
        title: "Register",
        error: "Passwords do not match.",
      });
    }
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.render("register", {
        title: "Register",
        error: "Username already exists",
      });
    }
    const newUser = new User({ username, email });
    await User.register(newUser, password);
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("register", {
      title: "Register",
      error: "An error occured during registration",
    });
  }
});

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/home", ensureAuthenticated, function (req, res) {
  Post.find({})
    .then(function (posts) {
      res.render("home", { title: "Homepage", posts, user: req.user._id });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/compose", ensureAuthenticated, function (req, res) {
  res.render("compose", { title: "Compose" });
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postContent,
    user: req.user._id,
  });
  post
    .save()
    .then(function (data) {
      if (data) {
        res.redirect("/home");
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
  Post.findOne({ _id: requestedPostID }).populate("comments")
    .then(function (post) {
      res.render("post", { title: post.title, content: post.content, comments: post.comments, post: post });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/post/edit/:postID", ensureAuthenticated, function (req, res) {
  const requestedPostID = req.params.postID;
  Post.findOne({ _id: requestedPostID, user: req.user._id })
    .then(function (post) {
      if(!post){
        return res.status(403).send("You are not authorized to edit post!");
      }
      res.render("edit", { title: "Edit Post", post });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/post/edit/:postID", function (req, res) {
  const editPostID = req.params.postID;
  const updatePost = {
    title: req.body.postTitle,
    content: req.body.postContent,
  };
  Post.findOneAndUpdate({ _id: editPostID, user: req.user._id }, updatePost)
    .then(function (post) {
      if(!post){
        return res.status(403).send("You are not authorized to edit post!");
      }
      res.redirect("/home");
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/post/delete/:postID", ensureAuthenticated, function (req, res) {
  Post.findOneAndDelete({ _id: req.params.postID, user: req.user._id }).then(function (post) {
    if (!post) {
      return res.status(403).send("You are not authorized to delete this post!");
    }
    res.redirect("/home");
  }).catch(function(err){
    console.log(err)
    res.redirect("/home")
  });
});

app.get("/user/details/:userID", ensureAuthenticated, function (req, res) {
  const requestedId = req.params.userID;
  User.findOne({ _id: requestedId })
    .then(function (user) {
      res.render("user", { title: "Profile", user })
    })
    .catch(function (err) {
      res.status(404).send(err);
    });
});

app.post("/add/comment", ensureAuthenticated, async function(req, res){
  const { postId, content } = req.body;
  const comment = new Comment({
    author: req.user.username,
    content,
    postId,
  });
  // newComment.save().then(function(comment){
  //   if(comment){
  //     res.redirect("/posts/" + postId);
  //   } else {
  //     console.log(err);
  //   }
  // });

  try {
    const savedComment = await comment.save();
    const post = await Post.findById(postId);
    post.comments.push(savedComment._id);
    await post.save();
    res.redirect("/posts/" + postId);
  } catch (error) {
    console.log(error);
    res.redirect("/posts/" + postId);
  }
});


app.listen(port, function () {
  console.log("Server running on port " + port);
});
