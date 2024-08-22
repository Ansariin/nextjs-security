const { isIpBlocked } = require('../lib/geoIP');

const blockIPMiddleware = (req, res, next) => {
  const clientIp = req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for'];
  
  if (isIpBlocked(clientIp)) {
    res.status(403).send('Your IP has been blocked.');
  } else {
    next();
  }
};

module.exports = blockIPMiddleware;