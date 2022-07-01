const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
require('dotenv').config()
require('./auth');

app.set('view engine', 'ejs');
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./routes'));

app.use((req, res, next) => {
    const error = new Error("Not Found !")
    // error.status(404)
    next(error)
})

app.use((error, req, res, next) => {
    // res.status(error.status || 500);
    res.send("<h3>" + error.message + "</h3>")
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server listening on http://localhost:3000 ...');
});