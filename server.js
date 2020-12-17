const fs = require('fs');
const http = require('http');
const https = require('https');

const accessToken = '2MMTqs9tilAAAAAAAAAAT12blR8o5M-X26TeYbExYdkM8BT1LxvdUa1y9Tj67Sy';

function contains(array, value) {
	for (var i in array) {
		if (array[i] == value) {
			return true;
		}
	}

	return false;
}

function getUserList(func) {
	const options = {
		'host': 'api.dropboxapi.com',
		'path': '/2/files/list_folder',
		'method': 'POST',
		'headers': {'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + accessToken + 'G'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			let data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				let users = [];
				data = JSON.parse(data);
				for (let i in data['entries']) {
					const temp = data['entries'][i]['name'];
					users.push(temp);
				}

				func(users);
			});
		} else {
			console.log('Dropbox request failed with status: ' + response.statusCode);
		}
	});
	req.write('{\"path\": \"/users/\",\"include_media_info\":false,\"include_deleted\":false}');
	req.end();
}

function getUser(name, func) {
	const options = {
		'host': 'content.dropboxapi.com',
		'path': '/2/files/download',
		'method': 'POST',
		'headers': {'Content-Type': 'application/octet-stream',
					'Authorization': 'Bearer ' + accessToken + 'G',
					'Dropbox-API-Arg': '{\"path\": \"/users/' + name + '\"}'}
	};

	const req = https.request(options, function(response) {
		if (response.statusCode === 200) {
			let data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				func(JSON.parse(data));
			});
		} else if (response.statusCode === 409) {
			func();
		} else {
			console.log('Dropbox request failed with status: ' + response.statusCode);
		}
	});
	req.end();
}

function saveUser(name, data, func) {
	const options = {
		'host': 'content.dropboxapi.com',
		'path': '/2/files/upload',
		'method': 'POST',
		'headers': {'Content-Type': 'application/octet-stream',
					'Authorization': 'Bearer ' + accessToken + 'G',
					'Dropbox-API-Arg': '{\"path\": \"/users/' + name + '\",\"mode\": \"overwrite\",\"autorename\": true,\"mute\": false}'}
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

function getGamesList(func) {
	const options = {
		'host': 'api.dropboxapi.com',
		'path': '/2/files/list_folder',
		'method': 'POST',
		'headers': {'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + accessToken + 'G'}
	};

	const req = https.request(options, function(response) {
		if(response.statusCode === 200) {
			let data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				let games = [];
				data = JSON.parse(data);
				for (let i in data['entries']) {
					const temp = data['entries'][i]['name'];
					games.push(temp);
				}

				func(games);
			});
		} else {
			console.log('Dropbox request failed with status: ' + response.statusCode);
		}
	});
	req.write('{\"path\": \"/games/\",\"include_media_info\":false,\"include_deleted\":false}');
	req.end();
}

function getNewGameNumber(func) {
	getGamesList(function(data) {
		let max = 0;
		for (let i in data) {
			const temp = parseInt(data[i]);
			if (temp > max) {
				max = temp;
			}
		}

		func(max + 1);
	});
}

function createGame(num, data, func) {
	const options = {
		'host': 'content.dropboxapi.com',
		'path': '/2/files/upload',
		'method': 'POST',
		'headers': {'Content-Type': 'application/octet-stream',
					'Authorization': 'Bearer ' + accessToken + 'G',
					'Dropbox-API-Arg': '{\"path\": \"/games/' + num + '\",\"mode\": \"overwrite\",\"autorename\": true,\"mute\": false}'}
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

function writeClearCookieHeader(response, statusCode) {
	response.writeHead(statusCode, {'Access-Control-Allow-Origin': 'herokuapp.com',
									'Set-Cookie': ['terranovumusername=;expires=Thu, 01 Jan 1970 00:00:01 GMT', 'terranovumauth=;expires=Thu, 01 Jan 1970 00:00:01 GMT']});
}

function authenticateWithCookies(request, response, func) {
	let sent = false;
	if(request.headers.cookie && request.headers.cookie.length > 0) {
		const cookies = getCookies(request.headers.cookie);

		if(cookies['terranovumusername'] && cookies['terranovumusername'].length > 0 && cookies['terranovumauth'] && cookies['terranovumauth'].length > 0) {
			const name = cookies['terranovumusername'];
			const cookie = cookies['terranovumauth'];
			sent = true;
			getUser(name, function(data) {
				if (data) {
					if (name == data['user']) {
						if (cookie == data['cookie']) {
							response.writeHead(200, {'Access-Control-Allow-Origin': 'herokuapp.com'});
							func();
							return;
						}
					}
				}

				writeClearCookieHeader(response, 401);
				return response.end();
			});
		}
	}

	if(!sent) {
		writeClearCookieHeader(response, 401);
		return response.end();
	}
}

function createAuthBinaryString() {
	return Math.floor(Math.random()*Math.pow(2, 31)).toString(2);
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
				case '':
				case '/':
				case '/index.html':
					fs.readFile('index.html', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/html'});
						return response.end(data);
					});
					break;
				case '/login.css':
					fs.readFile('login.css', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/css'});
						return response.end(data);
					});
					break;
				case '/login.js':
					fs.readFile('login.js', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/js'});
						return response.end(data);
					});
					break;
				case '/games':
					// TODO
					break;
				case '/createGame':
					authenticateWithCookies(request, response, function() {
						getNewGameNumber(function(data) {
							// TODO
							createGame(data, '', function() {
								return response.end(data.toString());
							});
						});
					});
					break;
				case '/auth':
					authenticateWithCookies(request, response, function() {
						return response.end();
					});
					break;
				case '/logout':
					writeClearCookieHeader(response, 200);
					return response.end();
					break;
				case '/404.html':
					fs.readFile('404.html', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(404, {'Content-Type': 'text/html'});
						return response.end(data);
					});
					break;
				case '/404.css':
					fs.readFile('404.css', function(err, data) {
						if(err) {
							console.log(err);
						}
						response.writeHeader(200, {'Content-Type': 'text/css'});
						return response.end(data);
					});
					break;
				default:
					const pathArr = request.url.split('/');
					const path = pathArr[pathArr.length - 1];

					getGamesList(function(data) {
						if(contains(data, path)) {
							response.writeHeader(200, {'Content-Type': 'text/html'});
							return response.end();
						} else {
							fs.readFile('404.html', function(err, data) {
								if(err) {
									console.log(err);
								}
								response.writeHeader(404, {'Content-Type': 'text/html'});
								return response.end(data);
							});
						}
					});
					break;
			}
			break;
		case 'POST':
			switch(request.url) {
				case '/login':
					request.on('error', function(err) {
						console.log(err);
						response.statusCode = 500;
						return response.end();
					});
					request.on('data', function(data) {
						body += data;
						if (body.length > 1e6) {
							request.connection.destroy();
						}
					});
					request.on('end', function() {
						const params = getParams(body);
						if (params['user'] && params['pass']) {
							getUser(params['user'], function(data) {
								if (data) {
									if (params['pass'] == data['pass']) {
										const cookie = createAuthBinaryString();
										data['cookie'] = cookie;
										saveUser(params['user'], JSON.stringify(data), function() {});
										response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8',
																 'Access-Control-Allow-Origin': 'herokuapp.com',
																 'Set-Cookie': ['terranovumusername=' + params['user'], 'terranovumauth=' + cookie]});
										return response.end();
									} else {
										response.statusCode = 401;
										return response.end();
									}
								} else {
									response.statusCode = 401;
									return response.end();
								}
							});
						} else {
							response.statusCode = 400;
							return response.end();
						}
					});
					break;
				case '/register':
					request.on('error', function(err) {
						console.log(err);
						response.statusCode = 500;
						return response.end();
					});
					request.on('data', function(data) {
						body += data;
						if (body.length > 1e6) {
							request.connection.destroy();
						}
					});
					request.on('end', function() {
						const params = getParams(body);
						if (params['user'] && params['pass']) {
							getUserList(function(data) {
								for (let i in data) {
									if (params['user'] == data[i]) {
										response.statusCode = 409;
										return response.end();
									}
								}

								const cookie = createAuthBinaryString();
								saveUser(params['user'], '{\"user\":\"' + params['user'] + '\",\"pass\":\"' + params['pass'] + '\",\"games\":[],\"cookie\":\"' + cookie + '\"}', function() {});
								response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8',
														 'Access-Control-Allow-Origin': 'herokuapp.com',
														 'Set-Cookie': ['terranovumusername=' + params['user'], 'terranovumauth=' + cookie]});
								return response.end();
							});
						} else {
							response.statusCode = 400;
							return response.end();
						}
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