var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');
var passport = require('passport');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');

//Set: Puerto
app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride());
app.use(require('./middleware/cors'));
app.use(passport.initialize());
app.use(passport.session());

// Set: Carpeta Views para las vistas de la api
app.set('views', __dirname + '/views/pages');

// Set: Motor de vistas, habilito para vistas html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

require('./passport')(app, passport);
app.passport = passport;

require('./routes')(app);

app.get('/', function (request, response) {
  response.render('main.html');
});

// Set: Conecto el puerto con la api
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;

//Creo la tabla de la base de datos //
pg.connect(config.DATABASE_URL, function (err, client, done) {
  if (err)
    throw err;
  client.query('CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, name VARCHAR(30), alias VARCHAR(20),' +
    ' password VARCHAR(300), email VARCHAR(30), interests VARCHAR(100), sex VARCHAR(4), age VARCHAR(10),' +
    ' latitude VARCHAR(30), longitude VARCHAR(30), image bytea)', function (err, result) {
    if (err) {
      console.log(err);
      throw err;
    }
    client.query('CREATE TABLE IF NOT EXISTS interests(id SERIAL PRIMARY KEY, category VARCHAR(30), value VARCHAR(30))', function (err, result) {
      if (err) {
        console.log(err);
        throw err;
      }
      done();
    });
  });
  //});
});
