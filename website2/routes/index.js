var express = require('express');
var app = express.Router();

/* GET home page. */
app.get("/", (req, res) => {
  res.render("signin");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { name, password } = req.body;

  if (password.length < 7) {
    return res.render("signup", {
      error: "Password must be at least 7 characters long.",
    });
  }

  const data = {
    name,
    password,
  };

  await collection.insertMany([data]);

  res.render("home");
});

app.all("/signin", async (req, res) => {
  if (req.method === "GET") {
    res.render("signin");
  } else if (req.method === "POST") {
    try {
      const check = await collection.findOne({ name: req.body.name });

      if (check.password === req.body.password) {
        res.render("signin");
      } else {
        res.send("Wrong Password!");
      }
    } catch {
      res.send("Wrong Details!");
    }
  }
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

module.exports = app;
