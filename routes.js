'use strict';

exports = module.exports = function(app) {
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/users/:id', require('./api/user').get);
};
