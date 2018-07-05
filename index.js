var Bloomio = require('./src/bloomio');

// dont override global variable
if (typeof window !== 'undefined' && typeof window.Bloomio === 'undefined') {
    window.Bloomio = Bloomio;
}

module.exports = Bloomio;
