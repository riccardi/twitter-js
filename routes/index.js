var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
// could use one line instead: var router = require('express').Router();
var tweetBank = require('../tweetBank');
// parse application/json
// app.use(bodyParser.json())
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })


module.exports = function (io) {
  router.get('/', function (req, res) {
  var tweets = tweetBank.list();
 
  res.render( 'index', { title: 'Twitter.js', tweets: tweets, showForm: true } );
});

router.get('/users/:name', function(req, res) {
  var name = req.params.name;
  var list = tweetBank.find( {name: name} );
  res.render( 'index', { title: 'Twitter.js - Posts by '+name, tweets: list, name: name, showForm: true } );
});

router.post('/tweets', urlencodedParser, function(req, res) {
	if (!req.body) return res.sendStatus(400)
  var name = req.body.name;
  var text = req.body.text;
  tweetBank.add(name, text);
  io.sockets.emit('new_tweet', { text: text, name:name });

  res.redirect('/');
});


  return router;
};

