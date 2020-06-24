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
					'Dropbox-API-Arg': '{\"path\": \"/spacegame/' + table + '\"}'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			let data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				func(data);
			});
		} else {
			console.log('Dropbox request failed with status: ' + response.statusCode);
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
					'Dropbox-API-Arg': '{\"path\": \"/spacegame/' + table + '\",\"mode\": \"overwrite\",\"autorename\": true,\"mute\": false\}'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			func();
		} else {
			console.log('Dropbox request failed with status: ' + response.statusCode);
		}
	});
	req.write(data);
	req.end();
}

function getCookies(req) {
	let cookies = {};

	req.split(';').forEach(function(cookie) {
		var parts = cookie.split('=');
		cookies[parts.shift().trim()] = decodeURIComponent(parts.join('='));
	});

	return cookies;
}

function getParams(req) {
	const vars = req.split('&');
	let query_string = {};
	for(var i = 0; i < vars.length; i++) {
		let pair = vars[i].split('=');
		query_string[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}

	return query_string;
}

http.createServer(function(request, response) {
	let body = '';
	switch(request.method) {
		case 'GET':
			switch(request.url) {
				case '/':
					let html;
					fs.readFile('index.html', function(err, data) {
						if(err) {
							console.log(err);
						}

						html = data;
						if(request.headers.cookie && request.headers.cookie.length > 0) {
							console.log('ughhh');
							const cookies = getCookies(request.headers.cookie);

							if(cookies['terranovumusername'] && cookies['terranovumauth']) {
								const name = cookies['terranovumusername'];
								const cookie = cookies['terranovumauth'];
								getTable('users', function(data) {
									let parsed = JSON.parse(data);
									for(let i in parsed) {
										if(name == parsed[i]['user']) {
											if(cookie == parsed[i]['cookie']) {
												const newCookie = Math.floor(Math.random()*Math.pow(2, 31)).toString(2);
												parsed[i]['cookie'] = newCookie;
												saveTable('users', JSON.stringify(parsed), function() {});
												response.writeHead(200, {'Content-Type': 'text/html',
																		'Access-Control-Allow-Origin': 'herokuapp.com',
																		'Set-Cookie': ['terranovumusername=' + name, 'terranovumauth=' + newCookie]});
												return response.end(html);
											}
											break;
										}
									}

									response.writeHead(404, {'Content-Type': 'text/html',
															'Access-Control-Allow-Origin': 'herokuapp.com',
															'Set-Cookie': ['terranovumusername=', 'terranovumauth=']});
									return response.end(html);
								});
							}
						}

						response.writeHead(200, {'Content-Type': 'text/html',
												'Access-Control-Allow-Origin': 'herokuapp.com',
												'Set-Cookie': ['terranovumusername=', 'terranovumauth=']});
						return response.end(html);
					});
					break;
				case '/css.css':
					fs.readFile('css.css', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/css'});
						return response.end(data);
					})
					break;
				case '/game.js':
					fs.readFile('game.js', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/js'});
						return response.end(data);
					})
					break;
				case '/games':
					break;
				default:
					response.statusCode = 404;
					return response.end();
					break;
			}
			break;
		case 'POST':
			switch(request.url) {
				case '/login':
					request.on('error', function(err) {
						console.log(err);
						response.statusCode = 400;
						return response.end();
					});
					request.on('data', function(data) {
						body += data;
						if (body.length > 1e6) {
							request.connection.destroy();
						}
					});
					request.on('end', function() {
						getTable('users', function(data) {
							let parsed = JSON.parse(data);
							const params = getParams(body);
							if(params['user'] && params['pass']) {
								let name = params['user'];
								let pass = params['pass'];
								for(let i in parsed) {
									if(name == parsed[i]['user']) {
										if(pass == parsed[i]['pass']) {
											const cookie = Math.floor(Math.random()*Math.pow(2, 31)).toString(2);
											parsed[i]['cookie'] = cookie;
											saveTable('users', JSON.stringify(parsed), function() {});
											response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8',
																	'Access-Control-Allow-Origin': 'herokuapp.com',
																	'Set-Cookie': ['terranovumusername=' + name, 'terranovumauth=' + cookie]});
											return response.end();
										} else {
											response.statusCode = 401;
											return response.end();
										}
										break;
									}
								}
							} else {
								response.statusCode = 400;
								return response.end();
							}
						});
					});
					break;
				case '/register':
					request.on('error', function(err) {
						console.log(err);
						response.statusCode = 400;
						return response.end();
					});
					request.on('data', function(data) {
						body += data;
						if (body.length > 1e6) {
							request.connection.destroy();
						}
					});
					request.on('end', function() {
						getTable('users', function(data) {
							let parsed = JSON.parse(data);
							const params = getParams(body);
							if(params['user'] && params['pass']) {
								let name = params['user'];
								let pass = params['pass'];
								for(let i in parsed) {
									if(name == parsed[i]['user']) {
										response.statusCode = 409;
										return response.end();
									}
								}

								const cookie = Math.floor(Math.random()*Math.pow(2, 31)).toString(2);
								parsed.push({'user': name, 'pass': pass, 'games': [], 'cookie': cookie});
								saveTable('users', JSON.stringify(parsed), function() {});
								response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8',
														'Access-Control-Allow-Origin': 'herokuapp.com',
														'Set-Cookie': ['terranovumusername=' + name, 'terranovumauth=' + cookie]});
								return response.end();
							} else {
								response.statusCode = 400;
								return response.end();
							}
						});
					});
					break;
				default:
					response.statusCode = 404;
					return response.end();
					break;
			}
			break;
		default:
			response.statusCode = 404;
			return response.end();
			break;
	}
}).listen(process.env.PORT || 5000);