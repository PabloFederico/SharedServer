var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');
var passport = require('passport');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');

app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));

app.use(methodOverride());
app.use(require('./middleware/cors'));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', __dirname + '/views/pages');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

require('./passport')(app, passport);
app.passport = passport;

require('./routes')(app);

app.get('/', function (request, response) {
  response.render('main.html');
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;

pg.connect(config.DATABASE_URL, function (err, client, done) {
  if (err)
    throw err;
  client.query('CREATE TABLE IF NOT EXISTS' +
  ' users(id SERIAL PRIMARY KEY,' +
  ' name VARCHAR(30),' +
  ' alias VARCHAR(20),' +
  ' password VARCHAR(300),' +
  ' email VARCHAR(30),' +
  ' gender VARCHAR(1),' +
  ' age VARCHAR(10),' +
  ' latitude VARCHAR(30),' +
  ' longitude VARCHAR(30),' +
  ' photo_profile bytea)', function (err, result) {
    if (err) {
      console.log(err);
      throw err;
    }
    client.query('CREATE TABLE IF NOT EXISTS' +
    ' interests(id SERIAL PRIMARY KEY,' +
    ' category VARCHAR(30),' +
    ' value VARCHAR(30))', function (err, result) {
      if (err) {
        console.log(err);
        throw err;
      }
    });

    client.query('CREATE TABLE IF NOT EXISTS' +
    ' userInterests(userId integer REFERENCES users (id),' +
    ' interestId integer REFERENCES interests (id),' +
    ' PRIMARY KEY(userId, interestId))', function (err, result) {
      if (err) {
        console.log(err);
        throw err;
      }
      done();
    });
  });
});
