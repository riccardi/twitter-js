var express = require('express');
var router = express.Router();
// could use one line instead: var router = require('express').Router();

var bodyParser = require('body-parser');
var tweetBank = require('../tweetBank');

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });


module.exports = function(io, client) {
    router.get('/', function(req, res) {
        //var tweets = tweetBank.list();
        //res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
        client.query('SELECT * FROM tweets, users WHERE tweets.userid = users.id', function(err, result) {
            var tweets = result.rows;
            console.log(tweets);
            res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
        });
    });

    router.get('/users/:name', function(req, res) {
        var name = Number(req.params.name);
        // var list = tweetBank.find({ name: name });
        // res.render('index', { title: 'Twitter.js - Posts by ' + name, tweets: list, name: name, showForm: true });
        client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id WHERE userid=$1', [name], function(err, result) {
            var tweets = result.rows;
            res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
        });
    });

    router.post('/tweets', urlencodedParser, function(req, res) {
        if (!req.body) {
            return res.sendStatus(400);
        }
        var name = req.body.name;
        var text = req.body.text;
        //tweetBank.add(name, text);
        client.query('SELECT * FROM users WHERE name=$1', [name], function(err, result) {
            if (result.rows.length > 0) {
                var userId = result.rows[0].id;
                var pic = result.rows[0].pictureurl;
                client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, text], function(err, data) {
                    io.sockets.emit('new_tweet', { text: text, name: name, pictureurl: pic, userId: userId });
                });
            } else {
                client.query('INSERT INTO users (name, pictureurl) VALUES ($1, $2)', [name, "https://placekitten.com/g/50/50"], function(err, data) {
                    client.query('SELECT * FROM users WHERE name=$1', [name], function(err, result) {
                        var userId = result.rows[0].id;
                        var pic = result.rows[0].pictureurl;
                        client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, text], function(err, data) {
                            io.sockets.emit('new_tweet', { text: text, name: name, pictureurl: pic, userId: userId });
                        });
                    });
                });
            }
        });


        //res.redirect('/');

    });




    return router;
};
