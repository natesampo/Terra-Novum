const fs = require('fs');
const http = require('http');
const https = require('https');

const accessToken = '2MMTqs9tilAAAAAAAAAAT12blR8o5M-X26TeYbExYdkM8BT1LxvdUa1y9Tj67Sy';

function getTable(table, func) {
	const options = {
		'host': 'content.dropboxapi.com',
		'path': '/2/files/download',
		'method': 'GET',
		'headers': {'Content-Type': 'application/octet-stream',
					'Authorization': 'Bearer ' + accessToken + 'G',
					'Dropbox-API-Arg': '{\"path\": \"/' + table + '\"}'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			func();
			let data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});

			response.on('end', function() {
				func(data);
			});
		} else {
			console.log('Request failed with status: ' + response.statusCode);
		}
	});
	req.end();
}

function saveTable(table, data, func) {
	const options = {
		'host': 'content.dropboxapi.com',
		'path': '/2/files/upload',
		'method': 'POST',
		'headers': {'Content-Type': 'application/octet-stream',
					'Authorization': 'Bearer ' + accessToken + 'G',
					'Dropbox-API-Arg': '{\"path\": \"/' + table + '\"}'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			func();
		} else {
			console.log('Request failed with status: ' + response.statusCode);
		}
	});
	req.write(data);
	req.end();
}

http.createServer((request, response) => {
	switch(request.method) {
		case 'GET':
			switch(request.url) {
				case '/':
					fs.readFile('index.html', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/html'});
						response.write(data);
						response.end();
					})
					break;
				case '/css.css':
					fs.readFile('css.css', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/css'});
						response.write(data);
						response.end();
					})
					break;
				case '/game.js':
					fs.readFile('game.js', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/js'});
						response.write(data);
						response.end();
					})
					break;
				case '/games':
					request.headers.cookie;
					break;
				default:
					response.statusCode = 404;
					response.end();
					break;
			}
			break;
		case 'POST':
			switch(request.url) {
				case '/register':
					const {headers, method, url} = request;
					let body = '';
					request.on('error', function(err) {
						console.log(err);
						response.statusCode = 400;
						response.end();
					}).on('data', function(data) {
						body += data;
						if (body.length > 1e6) {
							request.connection.destroy();
						}
					}).on('end', function() {
						getTable('users', function(data) {
							console.log('data');
							const parsed = JSON.parse(data);
							const name = body.split('&')[0].split('=')[1];
							let found = false;
							for(let i in parsed) {
								if(name == parsed[i]['user']) {
									found = true;
									break;
								}
							}

							if(found) {
								response.statusCode = 409;
								response.end();
							} else {
								saveTable('users', JSON.stringify([{'user': 'N4tticus', 'pass': 'asdf', 'games': []}]), function() {
									const cookie = Math.floor(Math.random()*Math.pow(2, 31)).toString(2);
									response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8',
															'Access-Control-Allow-Origin': 'spacegametwo.herokuapp.com',
															'Set-Cookie': ['username=Nate', 'spacegameauth=' + cookie]});
									response.end();
								});
							}
						});
					});
					break;
				default:
					response.statusCode = 404;
					response.end();
					break;
			}
			break;
		default:
			response.statusCode = 404;
			response.end();
			break;
	}
}).listen(process.env.PORT || 5000);