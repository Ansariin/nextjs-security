// /lb/geoIp.js

const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');
const useragent = require('user-agent');
const requestIp = require('request-ip');

const blockedIpsPath = path.join(__dirname, '../logs/blockedIps.json');
const rateLimitPath = path.join(__dirname, '../logs/rateLimit.json');

// Default rate limiting settings
const DEFAULT_RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_REQUEST_LIMIT = 1000; // Number of requests allowed per window

const loadBlockedIps = () => {
  try {
    const data = fs.readFileSync(blockedIpsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load blocked IPs:', err);
    return [];
  }
};

const saveBlockedIps = (blockedIps) => {
  try {
    fs.writeFileSync(blockedIpsPath, JSON.stringify(blockedIps, null, 2));
  } catch (err) {
    console.error('Failed to save blocked IPs:', err);
  }
};

const isIpBlocked = (ip) => {
  const blockedIps = loadBlockedIps();
  return blockedIps.includes(ip);
};

const addIPToBlocklist = (ip) => {
  const blockedIps = loadBlockedIps();
  if (!blockedIps.includes(ip)) {
    blockedIps.push(ip);
    saveBlockedIps(blockedIps);
  }
};

const removeIPFromBlocklist = (ip) => {
  let blockedIps = loadBlockedIps();
  blockedIps = blockedIps.filter(blockedIp => blockedIp !== ip);
  saveBlockedIps(blockedIps);
};

// Load and save rate limit data
const loadRateLimitData = () => {
  try {
    const data = fs.readFileSync(rateLimitPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load rate limit data:', err);
    return {};
  }
};

const saveRateLimitData = (data) => {
  try {
    fs.writeFileSync(rateLimitPath, JSON.stringify(data, null, 2));
    // console.log('Rate limit data saved successfully');
  } catch (err) {
    console.error('Failed to save rate limit data:', err);
  }
};

const trackRequest = (ip, rateLimitConfig) => {
  const { window = DEFAULT_RATE_LIMIT_WINDOW, limit = DEFAULT_REQUEST_LIMIT } = rateLimitConfig;
  const rateLimitData = loadRateLimitData();
  const now = Date.now();

  // console.log('Tracking request for IP:', ip);
  
  if (!rateLimitData[ip]) {
    // console.log('No existing record for IP, creating new entry.');
    rateLimitData[ip] = { count: 1, firstRequest: now };
  } else {
    rateLimitData[ip].count += 1;
    // console.log(`Updated request count for IP ${ip}: ${rateLimitData[ip].count}`);
  }

  // Remove outdated entries
  Object.keys(rateLimitData).forEach(ip => {
    if (now - rateLimitData[ip].firstRequest > window) {
      // console.log(`Removing outdated entry for IP ${ip}`);
      delete rateLimitData[ip];
    }
  });

  // Check if the rate limit is exceeded
  if (rateLimitData[ip].count > limit) {
    // console.log(`Rate limit exceeded for IP ${ip}. Adding to blocklist.`);
    addIPToBlocklist(ip);
    delete rateLimitData[ip];
  }

  // console.log('Saving rate limit data:', rateLimitData);
  saveRateLimitData(rateLimitData);
};

const getRequestDetails = (req, rateLimitConfig) => {
  const clientIp = requestIp.getClientIp(req);
  trackRequest(clientIp, rateLimitConfig); // Track each request

  const geo = geoip.lookup(clientIp);
  const userAgent = useragent.parse(req.headers['user-agent']);
  
  // Filter headers
  const essentialHeaders = ['host', 'referer', 'content-type', 'accept'];
  const headers = Object.keys(req.headers)
    .filter(key => essentialHeaders.includes(key.toLowerCase()))
    .reduce((obj, key) => {
      obj[key] = req.headers[key];
      return obj;
    }, {});

  return {
    ip: clientIp,
    userAgent: userAgent,
    geo: geo,
    timestamp: new Date(),
    method: req.method,
    endpoint: req.originalUrl,
    body: req.body,
    headers: headers
  };
};

module.exports = {
  getRequestDetails,
  isIpBlocked,
  addIPToBlocklist,
  removeIPFromBlocklist,
  loadBlockedIps,
  loadRateLimitData,
  saveRateLimitData
};
