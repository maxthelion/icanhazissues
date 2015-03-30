var express = require('express');
var router = express.Router();
var OAuth = require('oauth').OAuth2;
var qs = require('querystring');

/* Config file */
var config = require('../config.json');

var auth = new OAuth(
  config.githubClientId,
  config.githubClientSecret,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
);

/* Get the authorize URL from Github */
var authUrl = auth.getAuthorizeUrl({
  redirect_uri: 'http://localhost:3000/login',
  scope: ['repo'],
  state: config.githubState
});

/**
 * Check if an access token has already been issued.
 * @param req
 * @returns boolean
 */
function isAuthenticated(req) {
  if (req.signedCookies.accessToken) {
    return true;
  }
  return false;
}

/* Home page */
router.get('/', function(req, res, next) {
  if (!isAuthenticated(req)) {
    res.render('index', {authUrl: authUrl});
  } else {
    res.redirect('/repos');
  }
});

/**
 * Request a Github OAuth access token.
 * It is then set in the cookies.
 */
router.get('/login', function(req, res, next) {
  var query = qs.parse(req.url.split('?')[1]);
  auth.getOAuthAccessToken(
    query.code,
    {'redirect_uri': 'http://localhost:3000/'},
    function(error, accessToken, refreshToken, results) {
      if (error) {
        res.status(500).send(JSON.stringify({"error": error}));
      } else if (results.error) {
        res.status(401).send(JSON.stringify(results));
      } else {
        res.cookie(
          'accessToken',
          accessToken,
          {
            maxAge: 2592000000,
            signed: true
          });
        res.redirect('/');
      }
    }
  )
});

/* Logout and destroy the session */
router.get('/logout', function(req, res, next) {
  req.session = null;
  res.clearCookie('accessToken');
  res.render('logout');
})

module.exports = router;
