/* eslint-disable global-require*/
/* eslint-disable consistent-return*/

const jwt = require('jsonwebtoken');
const config = require('../../config.js');
const users = require('./users/userRoutes');
const documents = require('./documents/documentRoutes');
const roles = require('./roles/roleRoutes');

module.exports = (router) => {
  // test route to make sure everything is working
  router.get('/', ((req, res) => {
    res.status(200).json({
      message: 'yaaay! you will like it here'
    });
  }));

  require('./users/authRoute')(router);

  router.use((req, res, next) => {
    const _send = res.send;
    let sent = false;
    res.send = function (data) {
      if (sent) return;
      _send.bind(res)(data);
      sent = true;
    };
    next();
  });

  // middleware to use for all requests
  router.use((req, res, next) => {
    // check for the token in the header, post parameters or url parameters
    const token = req.headers['x-access-token'] || req.body.token || req.param.token;
    // when token is found
    if (token) {
      // check expiration and verify the secret
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          return res.status(403).send({
            message: 'failed to authenticate token',
            error: err
          });
        }
        // else save the token for use with the other requests
        req.decoded = decoded;

        // make sure we go to the next routes and don't stop here
        return next();
      });
    } else {
      // if there is no token
      return res.status(403).send({
        success: false,
        message: 'no token provided'
      });
    }
  });

  users(router);
  documents(router);
  roles(router);

  return router;
};
