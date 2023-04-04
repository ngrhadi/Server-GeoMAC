const { doubleCsrf } = require("csrf-csrf");
require('dotenv').config();

const CSRF_SECRET = process.env.CSRF_SECRET || "csrf-secret";
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "_cxrf";
const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: (req) => req.secret,
    secret: CSRF_SECRET,
    cookieName: CSRF_COOKIE_NAME,
    cookieOptions: { sameSite: true, secure: true, signed: true, maxAge: 60 * 60 * 1000 },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  });

const csrfErrorHandler = (error, req, res, next) => {
  if (error == invalidCsrfTokenError) {
    res.status(403).json({
      error: "csrf validation error",
    });
  } else {
    next();
  }
};

module.exports = {
  generateToken,
  doubleCsrfProtection,
  csrfErrorHandler,
}
