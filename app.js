var express = require( 'express' );
var swig = require( 'swig' );
var app = express(); // creates an instance of an express application
var server = app.listen(3000);
var socketio = require('socket.io');
var io = socketio.listen(server);



var routes = require("./routes/");

app.use("/", routes(io));
app.use(express.static("public"));

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
swig.setDefaults({ cache: false });

app.get('/', function(req, res) {
	var people = [{name: 'Grace'}, {name: 'Hopper'}, {name: 'Ashley'}, {name: 'Kathy'}];
	res.render( 'index', {title: 'Hall of Fame', people: people} );
	//res.send('Hello World!');
});

// in some file that is in the root directory of our application
var locals = {
    title: 'An Example',
    people: [
        { name: 'Gandalf'},
        { name: 'Frodo' },
        { name: 'Hermione'}
    ]
};

swig.renderFile(__dirname + '/views/index.html', locals, function (err, output) {
    // console.log(output);
});

