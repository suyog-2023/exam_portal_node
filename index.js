var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var upload = require("express-fileupload");
app.use(upload())

var session = require("express-session");
app.use(session({
    secret: "Suyog",
    saveUninitialized: true,
    resave: true
}));

app.use(express.static("public/"));

var adminRoute = require("./routes/admin_route");
var userRoute = require("./routes/user_route");

app.use("/", userRoute);
app.use("/admin", adminRoute);


app.listen(5000);