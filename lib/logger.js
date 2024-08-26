// /lib/logger.js
const fs = require('fs');
const path = require('path');
const { getRequestDetails, isIpBlocked } = require('./geoIP');

const logsFilePath = path.join(__dirname, '../logs/requests.json');

// Default rate limiting settings
const DEFAULT_RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_REQUEST_LIMIT = 1000; // Number of requests allowed per window

const logRequest = async (req, res, next, options = {}) => {
  const { saveEndpoints = [], maxSize = 10 * 1024 * 1024, rateLimitConfig = {} } = options;

  // Check if the IP is blocked
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (isIpBlocked(clientIp)) {
    return res.status(403).send('Your IP is blocked.');
  }

  // Check if the request matches the specified endpoints and methods
  const shouldLog = saveEndpoints.some(endpoint =>
    (endpoint.method === '*' || endpoint.method === req.method) && matchEndpoint(req.originalUrl, endpoint.endpoint)
  );

  if (!shouldLog) return next(); // Skip logging if the request does not match

  // Collect data to be logged
  const logData = getRequestDetails(req, rateLimitConfig);

  checkFileSizeAndClear(logsFilePath, maxSize);

  try {
    const logs = await loadLogs(); // Load logs with pagination
    logs.push(logData);
    saveLogs(logs);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next(); // Move to the next middleware
};

const matchEndpoint = (url, pattern) => {
  const regex = new RegExp(pattern.replace('*', '.*'));
  return regex.test(url);
};

const loadLogs = () => {
  try {
    const data = fs.readFileSync(logsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveLogs = (logs) => {
  fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
};

const checkFileSizeAndClear = (filePath, maxSize) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      fs.truncateSync(filePath, 0);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error checking file size:', error);
    }
  }
};

module.exports = { logRequest, loadLogs, saveLogs };
