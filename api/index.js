const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());

const users = [
	{
		id: '1',
		username: 'yogi',
		password: 'yogi007',
		isAdmin: true
	},
	{
		id: '2',
		username: 'deepak',
		password: 'deepak123',
		isAdmin: false
	},
	{
		id: '3',
		username: 'sanju',
		password: 'sanju456',
		isAdmin: false
	}
];

let refreshTokens = [];

app.post('/api/refresh', (req, res) => {
	//take the refresh from the user
	const refreshToken = req.body.token;

	//send error if there is no token or it's invalid
	if (!refreshToken) {
		return res.status(401).json('You are not authenticated!');
	}
	if (!refreshTokens.includes(refreshToken)) return res.status(403).json('Refresh token is invalid!!');

	jwt.verify(refreshToken, 'myRefreshSecrectKey', (err, user) => {
		console.log(user);
		err && console.log(err);
		console.log(err);
		refreshTokens = refreshTokens.filter(token => token !== refreshToken);
		const newAccessToken = generateAccessToken(user);
		const newRefreshToken = generateRefreshToken(user);
		refreshTokens.push(newRefreshToken);
		res.status(200).json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken
		});
	});
	//if everything is ok, create new access token ,refresh token and send to user
});

const generateAccessToken = user => {
	return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'mySecrectKey', { expiresIn: '30s' });
};

const generateRefreshToken = user => {
	return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'myRefreshSecrectKey');
};

app.post('/api/login', (req, res) => {
	const { username, password } = req.body;
	const user = users.find(u => {
		return u.username === username && u.password === password;
	});
	if (user) {
		// res.send(user)
		// res.json(user);
		//generate access token
		const accessToken = generateAccessToken(user);
		const refreshToken = generateRefreshToken(user);
		refreshTokens.push(refreshToken);
		res.json({ username: user.username, isAdmin: user.isAdmin, accessToken, refreshToken });
	} else {
		res.status(400).json('username or password incorrect!');
	}
});

const verify = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader) {
		const token = authHeader.split(' ')[1];
		jwt.verify(token, 'mySecrectKey', (err, user) => {
			console.log('userrr', user);
			if (err) {
				return res.status(403).json('Token is not valid!!');
			}
			req.user = user;
			next();
		});
	} else {
		res.status(401).json('you are not authenticated!');
	}
};

app.delete('/api/users/:userId', verify, (req, res) => {
	if (req.user.id === req.params.userId || req.user.isAdmin) {
		res.status(200).json('User has been deleted successfully!');
	} else {
		res.status(403).json('You are not allowed to delete this user!');
	}
});

app.post('/api/logout', verify, (req, res) => {
	const refreshToken = req.body.token;
	refreshTokens = refreshTokens.filter(token => token !== refreshToken);
	res.status(200).json('you logged out successfully!');
});

app.listen(5000, () => {
	console.log('backend server is running');
});
