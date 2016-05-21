'use strict';

exports = module.exports = function(app) {
	app.post('/login', require('./api/user').login);
	app.post('/signup', require('./api/user').signup);
	app.get('/users/:id', require('./api/user').get);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.put('/users/:id', require('./api/user').update);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
};
