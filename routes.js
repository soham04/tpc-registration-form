var tabular = require('tabular-json');
const myGoogleAPI = require("./google-api/api-upper-layer")
const fs = require('fs');
const formidable = require('formidable');
const passport = require('passport');
const session = require('express-session');
const mongoose = require("./mongoose")
const path = require('path');
const nodeMailer = require("./nodemailer");
require('dotenv').config()
const express = require('express');
const router = express.Router();

function isLoggedIn(req, res, next) {
    console.log("isLoggedIn = " + req.user);
    req.user ? next() : res.redirect("/");
}

router.get('/', (req, res) => {
    // res.send('<a href="/auth/google">Authenticate with Google</a>');
    res.render("home", { Company_Name: process.env.COMPANY_NAME })
});

router.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }
    ));

router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/registration-form',
        failureRedirect: '/auth/google/'
    })
);

router.get('/registration-form', isLoggedIn, (req, res) => {

    console.log(req.user);

    mongoose.model.findById(req.user.email, function (err, adventure) {
        if (adventure) {
            res.render("already")
        } else {
            res.render("form", {
                name: req.user.given_name,
                emailID: req.user.email,
                Company_Name: process.env.COMPANY_NAME,
            });
        }
    });
});

router.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/auth/google/failure', (req, res) => {
    res.send('Failed to authenticate');
});


router.post('/api/upload', isLoggedIn, async (req, res, next) => {

    const form = formidable({ multiples: true });

    mongoose.model.findById(req.user.email, function (err, adventure) {
        if (adventure) {
            res.render("already")
        }
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        var oldPath = files.someExpressFiles.filepath;
        // var newPath = path.join(__dirname, 'uploads')
        //     + '/' + files.someExpressFiles.originalFilename
        // var rawData = fs.readFileSync(oldPath)       // temporary variable to store the file in RAM
        // // console.log(fields);

        // fs.writeFile(newPath, rawData, function (err) { // writing thw file to the server file system 
        //     if (err) console.log(err)
        // })                  

        // console.log(newPath);

        let id = await myGoogleAPI.uploadToFolder(fields.name + " | Resume", "application/octet-stream", oldPath, process.env.FOLDER_ID)

        setTimeout(() => {
            console.log("hih" + id);
        }, 2000)

        console.log("DATA : =======" + fields.positions);

        let sample_entry = new mongoose.model({
            name: fields.name,
            gender: fields.gender,
            _id: req.user.email,
            contact_number: fields.phoneNumber,
            degree: fields.btechRadio,
            branch: fields.branchRadio.toString(),
            pass_out_year:fields.passYear,
            CGPA: fields.CGPA,
            class10: fields.class10,
            class12: fields.class12,
            collegename: fields.collegenameradio,
            resume: "https://drive.google.com/file/d/" + id + "/view",
        });

        console.log("Sample entry = \n" + sample_entry);

        opts = {            // css for table
            classes: { table: "table table-striped table-bordered" }
        };

        // console.log(sample_entry.toJSON());

        var result = tabular.html(sample_entry.toJSON(), opts);

        // console.log("result - " + result)

        let message = result          // message in the mail 

        nodeMailer.nodeMailerMain(message, req.user.email).catch(console.error);

        sample_entry.save(function (err, user) {
            if (err) {
                console.log("Resubmisison Error  = " + err);
                // res.send(400, 'Bad Request');
            }
        })
        res.render("done", { email: req.user.email })
    });
});

module.exports = router;