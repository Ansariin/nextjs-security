const requestLogger = require('./middleware/requestLogger');
const blockIPMiddleware = require('./middleware/blockIPMiddleware');
const { addIPToBlocklist, removeIPFromBlocklist, isIPBlocked } = require('./lib/geoIP');
const { loadLogs, saveLogs,logRequest } = require("./lib/logger")

module.exports = {
  requestLogger,
  blockIPMiddleware,
  addIPToBlocklist,
  removeIPFromBlocklist,
  isIPBlocked,
  loadLogs,
  saveLogs,
  logRequest
};