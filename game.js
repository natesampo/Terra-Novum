const usernameMaxLength = 16;
const passwordMaxLength = 32;

function getCookies() {
	let cookies = {};

	document.cookie.split(';').forEach(function(cookie) {
		let parts = cookie.split('=');
		let formatted = parts.shift().trim();

		if (formatted.startsWith('terranovum')) {
			cookies[formatted] = decodeURIComponent(parts.join('='));
		}
	});

	return cookies;
}

function displayVerify(idToHide) {
	if (idToHide) {
		document.getElementById(idToHide).style.display = 'none';
	}
	document.getElementById('verify').style.left = '0';
	document.getElementById('verify').style['line-height'] = '200px';
	document.getElementById('verify').style['margin-top'] = '-100px';
	document.getElementById('verify').style.position = 'absolute';
	document.getElementById('verify').style['text-align'] = 'center';
	document.getElementById('verify').style.top = '50%';
	document.getElementById('verify').style.width = '100%';
	document.getElementById('verify').style.display = 'inline';
}

function displayLogin(idToHide) {
	if (idToHide) {
		document.getElementById(idToHide).style.display = 'none';
	}
	document.getElementById('login').style.display = 'block';
	document.getElementById('accountdisplay').style.display = 'none';
	document.getElementById('accountname').innerHTML = '';
	document.getElementById('login').style.border = '1px solid black';
	document.getElementById('login').style.margin = '0 auto';
	document.getElementById('login').style['margin-top'] = '10%';
	document.getElementById('login').style.width = '30%';
}

function displayGames(idToHide) {
	if (idToHide) {
		document.getElementById(idToHide).style.display = 'none';
	}
	document.getElementById('accountdisplay').style.display = 'inline-block';
	document.getElementById('accountname').innerHTML = getCookies()['terranovumusername'];
	document.getElementById('games').style.display = 'block';
	document.getElementById('games').style.border = '1px solid black';
	document.getElementById('games').style.margin = '0 auto';
	document.getElementById('games').style['margin-top'] = '10%';
	document.getElementById('games').style.width = '30%';
}

function login() {
	const userElem = document.getElementById('usernamelogin');
	const passElem = document.getElementById('passwordlogin');
	const userRegElem = document.getElementById('usernamereg');
	const passRegElem = document.getElementById('passwordreg');
	const confirmRegElem = document.getElementById('confirmreg');

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('POST', '/login', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				userElem.value = '';
				passElem.value = '';
				userRegElem.value = '';
				passRegElem.value = '';
				confirmRegElem.value = '';
				displayGames('login');
			} else if (this.status === 401) {
				alert('Incorrect username or password');
			} else {
				alert('Uhhh something is wrong');
			}
		}
	}
	req.send('user=' + encodeURIComponent(userElem.value) + '&pass=' + encodeURIComponent(passElem.value));
}

function logout() {
	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('GET', '/logout', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				displayLogin('games');
			} else {
				alert('Uhhh something is wrong');
			}
		}
	}
	req.send();
}

function register() {
	const userElem = document.getElementById('usernamelogin');
	const passElem = document.getElementById('passwordlogin');
	const userRegElem = document.getElementById('usernamereg');
	const passRegElem = document.getElementById('passwordreg');
	const confirmRegElem = document.getElementById('confirmreg');

	if (userRegElem.value.length > usernameMaxLength) {
		alert('Username is too long');
		return;
	}

	if (userRegElem.value.length == 0) {
		alert('Username cannot be empty');
		return;
	}

	if (passRegElem.value != confirmRegElem.value) {
		alert('Two different passwords entered');
		return;
	}

	if (passRegElem.value.length > passwordMaxLength) {
		alert('Password too long');
		return;
	}

	if (passRegElem.value.length == 0) {
		alert('Password cannot be empty');
		return;
	}

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('POST', '/register', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				userElem.value = '';
				passElem.value = '';
				userRegElem.value = '';
				passRegElem.value = '';
				confirmRegElem.value = '';
				displayGames('login');
			} else if (this.status === 409) {
				alert('Username Already Taken');
			} else {
				alert('Uhhh something is wrong');
			}
		}
	}
	req.send('user=' + encodeURIComponent(userRegElem.value) + '&pass=' + encodeURIComponent(passRegElem.value));
}

function getGames() {
	if (document.cookie.length == 0) {
		displayLogin();

		return;
	}

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('GET', '/games', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				displayGames('login');
				//this.responseText
			} else {
				alert('Failed to authenticate');
				displayLogin();
			}
		}
	}
	req.send();
}

function createGame() {
	if (document.cookie.length == 0) {
		displayLogin();

		return;
	}

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('GET', '/createGame', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				alert('Fuck you pussy boy');
				//window.location.href = window.location.href + this.response + '.html';
			} else {
				displayLogin('games');
				alert('Unable to authenticate');
			}
		}
	}
	req.send();
}

if (document.cookie.length > 0) {
	displayVerify();
	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('GET', '/auth', true);
	req.onreadystatechange = function() {
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				displayGames('verify');
			} else {
				displayLogin('verify');
			}
		}
	}
	req.send();
} else {
	displayLogin();
}