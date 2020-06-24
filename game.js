const usernameMaxLength = 16;
const passwordMaxLength = 32;

function getCookie(cookieName) {
	const index = document.cookie.indexOf(cookieName);

	if(index == -1) {
		return null;
	}

	let tempString = document.cookie;
	if(index < document.cookie.indexOf(';')) {
		tempString = document.cookie.split(';')[0];
	}

	return tempString.substring(index + cookieName.length + 1);
}

function displayLogin(idToHide) {
	document.getElementById('login').style.display = 'block';
	document.getElementById('accountdisplay').style.display = 'none';
	document.getElementById('accountname').innerHTML = '';
	document.getElementById(idToHide).style.display = 'none';
	document.getElementById('login').style.border = '1px solid black';
	document.getElementById('login').style.margin = '0 auto';
	document.getElementById('login').style['margin-top'] = '10%';
	document.getElementById('login').style.width = '30%';
}

function displayGames(idToHide) {
	document.getElementById(idToHide).style.display = 'none';
	document.getElementById('accountdisplay').style.display = 'inline-block';
	document.getElementById('accountname').innerHTML = decodeURIComponent(getCookie('terranovumusername'));
	document.getElementById('games').style.display = 'block';
	document.getElementById('games').style.border = '1px solid black';
	document.getElementById('games').style.margin = '0 auto';
	document.getElementById('games').style['margin-top'] = '10%';
	document.getElementById('games').style.width = '30%';
}

function login() {
	const userElem = document.getElementById('usernamelogin');
	const passElem = document.getElementById('passwordlogin');

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('POST', '/login', true);
	req.onreadystatechange = function() {
		console.log(this.readyState);
		if(this.readyState === XMLHttpRequest.DONE) {
			if(this.status === 200) {
				userElem.value = '';
				passElem.value = '';
				displayGames('login');
			} else if(this.status === 401) {
				alert('Incorrect username or password');
			} else {
				alert('Uhhh something is wrong');
			}
		}
	}
	req.send('user=' + encodeURIComponent(userElem.value) + '&pass=' + encodeURIComponent(passElem.value));
}

function register() {
	const userElem = document.getElementById('usernamereg');
	const passElem = document.getElementById('passwordreg');
	const confElem = document.getElementById('confirmreg');

	if(userElem.value.length > usernameMaxLength) {
		alert('Username is too long');
		return;
	}

	if(userElem.value.length == 0) {
		alert('Username cannot be empty');
		return;
	}

	if(passElem.value != confElem.value) {
		alert('Two different passwords entered');
		return;
	}

	if(passElem.value.length > passwordMaxLength) {
		alert('Password too long');
		return;
	}

	if(passElem.value.length == 0) {
		alert('Password cannot be empty');
		return;
	}

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('POST', '/register', true);
	req.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE) {
			if(this.status === 200) {
				userElem.value = '';
				passElem.value = '';
				confElem.value = '';
				displayGames('login');
			} else if(this.status === 409) {
				alert('Username Already Taken');
			} else {
				alert('Uhhh something is wrong');
			}
		}
	}
	req.send('user=' + encodeURIComponent(userElem.value) + '&pass=' + encodeURIComponent(passElem.value));
}

function getGames() {
	if(document.cookie.length == 0) {
		displayLogin('games');

		return;
	}

	const req = new XMLHttpRequest();
	req.withCredentials = true;
	req.open('GET', '/games', true);
	req.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE) {
			if(this.status === 200) {
				displayGames('login');
				//this.responseText
			} else {
				alert('Failed to authenticate');
				displayLogin('games');
			}
		}
	}
}