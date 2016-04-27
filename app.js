var express = require( 'express' );
var swig = require( 'swig' );
var app = express(); // creates an instance of an express application
var routes = require("./routes/");

app.use("/", routes);
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

app.listen(3000, function() {
	console.log("Hey Ashley & Kathy!");
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
    console.log(output);
});