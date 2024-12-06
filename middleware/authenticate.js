// middleware/authenticate.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'aB3dE5fG7hI9jK1mN2oP3qR4sT5uV6wXn';

const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) return res.redirect('/login');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
