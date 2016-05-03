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
                // console.log(tweets);
                tweets.forEach(function(tweet){
                    var hashtagArrays = getHashtagsFromTweet(tweet.content);
                     if(hashtagArrays.length > 0){
                        tweet.content = addHyperlinkToHashTag(tweet.content, hashtagArrays[0], hashtagArrays[1]);
                     }
                    
                });
              
                res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
            });
        });

        router.get('/users/:name', function(req, res) {
            var name = Number(req.params.name);
            // var list = tweetBank.find({ name: name });
            // res.render('index', { title: 'Twitter.js - Posts by ' + name, tweets: list, name: name, showForm: true });
            client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id WHERE userid=$1', [name], function(err, result) {
                var tweets = result.rows;
                tweets.forEach(function(tweet){
                    var hashtagArrays = getHashtagsFromTweet(tweet.content);
                     if(hashtagArrays.length > 0){
                        tweet.content = addHyperlinkToHashTag(tweet.content, hashtagArrays[0], hashtagArrays[1]);
                     }
                    
                });
                res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
            });
        });

        router.get('/hashtags/:tagnum', function(req, res) {
            var tagnum = Number(req.params.tagnum);
            client.query('SELECT * FROM tweets INNER JOIN users ON tweets.userid = users.id INNER JOIN hashtags_tweets ON tweets.id=hashtags_tweets.tweet_id INNER JOIN hashtags ON hashtags_tweets.tag_id=hashtags.id WHERE hashtags.id =$1', [tagnum], function(err, result) {
                var tweets = result.rows;
                tweets.forEach(function(tweet){
                    var hashtagArrays = getHashtagsFromTweet(tweet.content);
                     if(hashtagArrays.length > 0){
                        // console.log(tweet.content + "before");
                        tweet.content = addHyperlinkToHashTag(tweet.content, hashtagArrays[0], hashtagArrays[1]);

                     }
                    
                });
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
                // if the user already exists
                if (result.rows.length > 0) {
                    var userId = result.rows[0].id;
                    var pic = result.rows[0].pictureurl;
                    client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, text], function(err, data) {
                        var hashtagArrays = getHashtagsFromTweet(text);
                         if(hashtagArrays.length > 0){
                            text = addHyperlinkToHashTag(text, hashtagArrays[0], hashtagArrays[1]);
                         }

                        io.sockets.emit('new_tweet', { text: text, name: name, pictureurl: pic, userId: userId });
                    });
                } else {
                    // the user doesn't exist, create new user
                    client.query('INSERT INTO users (name, pictureurl) VALUES ($1, $2)', [name, "https://placekitten.com/g/50/50"], function(err, data) {
                        // get the user's id
                        client.query('SELECT * FROM users WHERE name=$1', [name], function(err, result) {
                            var userId = result.rows[0].id;
                            var pic = result.rows[0].pictureurl;
                            // insert tweet with new user!
                            client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userId, text], function(err, data) {
                                 var hashtagArrays = getHashtagsFromTweet(text);
                                 if(hashtagArrays.length > 0){
                                    text = addHyperlinkToHashTag(text, hashtagArrays[0], hashtagArrays[1]);
                                 }
                                 
                                io.sockets.emit('new_tweet', { text: text, name: name, pictureurl: pic, userId: userId });
                            });
                        });
                    });
                }
            });


            //res.redirect('/');
        });

        //returns array of stored hasthags by [[name], [id]]
        function getHashtagsFromTweet(tweetText) {
            var tagArr = tweetText.match(/#(\w*\d*)/g);
            var numArr = [];
            if(!tagArr){
                return [];
            }
            for (var i = 0; i < tagArr.length; i++) {
                // does this hashtag exist?
                (function(i){
                client.query('SELECT * FROM hashtags WHERE tag=$1', [tagArr[i]], function(err, result) {
                        // if the user already exists
                        if (result.rows.length > 0) {
                            
                                numArr.push(+result.rows[0].id); 
                           
                            
                        }else{
                            //inserting new hashtag
                            client.query('INSERT INTO hashtags (tag) VALUES ($1)', [tagArr[i]], function(err, data){
                                //geting new hashtag id
                                client.query('SELECT id FROM hashtags WHERE tag=$1,' [tagArr[i]],function(err, data){

                                    numArr.push(+result.rows[0].id); 
                                });
                            });
                        }
                });
             })(i);
            }
            console.log(tagArr, numArr);

            return [tagArr, numArr];

        }

        function addHyperlinkToHashTag(tweet, tagNameArr, idArr){
            console.log("idArr is ", idArr);
              tagNameArr.forEach(function(tag, index){
                console.log("index is", index);
                tweet = tweet.replace(tag,'<a href="/hashtags/' + idArr[index] +'">'+tag +"</a>" );
              });
           return tweet; 
        }




        return router;
    };
