const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'the-hive-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.club = decoded;
        next();
    });
}

// Optional authentication - continues even without token
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.club = decoded;
            }
        });
    }
    next();
}

// Generate JWT token
function generateToken(club) {
    return jwt.sign(
        { id: club.id, name: club.name, email: club.email, isAdmin: club.is_admin },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    JWT_SECRET
};
