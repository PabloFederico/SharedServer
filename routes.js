'use strict';

function authenticateAndRun(app) {
	return app.passport.authenticate('local');
}

exports = module.exports = function(app) {
	app.post('/login', authenticateAndRun(app), require('./api/user').login);
	app.get('/users/:id', require('./api/user').get);
	app.get('/users', require('./api/user').getAll);
	app.post('/users', require('./api/user').create);
	app.put('/users/:id', require('./api/user').update);
	app.delete('/users/:id', require('./api/user').delete);
	app.get('/interests', require('./api/interest').getAll);
	app.post('/interests', require('./api/interest').create);
	app.delete('/interests/:id', require('./api/interest').delete);
	app.get('/users/:user/profile', require('./api/user').getProfile);
	app.get('/users/:user/candidates', require('./api/user').getCandidates);
	app.get('/form_newUser', require('./api/user').form_newUser);
	app.get('/form_viewUser', require('./api/user').form_viewUser);
	app.get('/form_editUser', require('./api/user').form_editUser);
	app.get('/form_newInterest', require('./api/user').form_newInterest);
	app.get('/form_viewInterests', require('./api/user').form_viewInterests);
	app.get('/form_viewUserInterest', require('./api/user').form_viewUserInterest);
};
