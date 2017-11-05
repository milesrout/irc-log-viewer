var express = require('express');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var app = express();
var db = new sqlite3.Database(process.argv[2]);

app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/initial', function(req, res) {
	db.all('SELECT * from messages ORDER BY id DESC LIMIT 50', function(err, rows) {
		if (err) {
			console.error(err);
			res.sendStatus(500);
		}
		res.json(rows);
	});
});

app.get('/more-after', function(req, res) {
	if (req.query.id === undefined) {
		return res.sendStatus(400);
	}
	const id = parseInt(req.query.id, 10);
	console.log('after', {id});
	db.all('SELECT * from messages WHERE id > ? ORDER BY id ASC LIMIT 50', id, function(err, rows) {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		}
		res.json(rows);
	});
});

app.get('/more-before', function(req, res) {
	if (req.query.id === undefined) {
		return res.sendStatus(400);
	}

	const id = parseInt(req.query.id, 10);
	console.log('before', {id});
	db.all('SELECT * from messages WHERE id < ? ORDER BY id DESC LIMIT 50', id, function(err, rows) {
		if (err) {
			console.error(err);
			res.sendStatus(500);
		}
		res.json(rows.reverse());
	});
});

app.listen(4000, function() {});
