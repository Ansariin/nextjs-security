const { getRequestDetails } = require('../lib/geoIP');
const { logRequest } = require('../lib/logger');

const requestLogger = (req, res, next) => {
  const logData = getRequestDetails(req);
  logRequest(logData);
  next();
};

module.exports = requestLogger;