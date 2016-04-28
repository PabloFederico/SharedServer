var express = require('express');
var app = express();
var pg = require('pg');
var config = require('./config');
var bodyParser = require('body-parser');

//Set: Puerto
app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.configure(function() {
  app.use(express.methodOverride());
  app.use(require('./middleware/cors'));
  app.use(app.router);
});

// Set: Carpeta Views para las vistas de la api
app.set('views', __dirname + '/views');

// Set: Motor de vistas, habilito para vistas html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

require('./routes')(app);

app.get('/', function(request, response) {
	response.render('pages/main.html');
});

// Set: Conecto el puerto con la api
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

pg.defaults.ssl = true;

//Creo la tabla de la base de datos //
pg.connect(config.DATABASE_URL, function(err, client) {
  if (err)
  	throw err;
  console.log('Creando tabla en caso de que no existe');
  var query = client.query('CREATE TABLE IF NOT EXISTS usuarios(id SERIAL PRIMARY KEY, name VARCHAR(30), email VARCHAR(30), alias VARCHAR(20), latitud VARCHAR(30), longitud VARCHAR(30))');
  query.on('end', function() { client.end(); });
});
