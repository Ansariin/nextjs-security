# nextjs-security

`nextjs-security` is a comprehensive security package designed to enhance the protection of your Node.js applications, especially those built with Express.js and Next.js. It provides middleware for request logging, IP blocking, and rate limiting, making it easier to identify and mitigate potential security threats such as brute force attacks and DDoS attacks.

## Features

- **Request Logging**: Logs request details, including IP address, user agent, geographical information, and request headers, to help monitor and debug your application.
- **IP Blocking**: Block specific IP addresses based on suspicious activity or predefined rules.
- **Rate Limiting**: Limits the number of requests a single IP can make within a specified time window to prevent abuse (e.g., brute force attacks, DDoS).

## Installation

Install the package using npm:

```bash
npm install nextjs-security
```

## Usage in Express.js

### Setup

To use `nextjs-security` in an Express.js application, follow these steps:

1. **Import the Middleware and Utility Functions:**

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { requestLogger, blockIPMiddleware, logRequest, addIPToBlocklist, removeIPFromBlocklist } = require('nextjs-security');

const app = express();

app.use(bodyParser.json());
```

2. **Configure Request Logging and Rate Limiting:**

You can configure the rate limit settings, logging endpoints, and file size for logs:

```javascript
const rateLimitConfig = {
  window: 15 * 60 * 1000, // 15 minutes
  limit: 200 // 200 requests per window
};

app.use((req, res, next) => {
  logRequest(req, res, next, {
    saveEndpoints: [
      { method: 'POST', endpoint: '/api/*' },
      { method: 'GET', endpoint: '/api/*' },
      { method: 'PUT', endpoint: '/api/*' },
      { method: 'DELETE', endpoint: '/api/*' },
    ],
    maxSize: 5 * 1024 * 1024, // 5MB max log file size
    rateLimitConfig: rateLimitConfig
  });
});
```

3. **Use IP Blocking Middleware:**

```javascript
app.use(blockIPMiddleware);
```

4. **Serve Static Files (Optional):**

If you want to serve a dashboard or static files:

```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

5. **Set Up API Endpoints for Managing IP Blocking:**

```javascript
app.post('/api/block-ip', (req, res) => {
  const { ip } = req.body;
  if (ip) {
    addIPToBlocklist(ip);
    res.sendStatus(200);
  } else {
    res.status(400).send('Please provide an IP address.');
  }
});

app.post('/api/unblock-ip', (req, res) => {
  const { ip } = req.body;
  if (ip) {
    removeIPFromBlocklist(ip);
    res.sendStatus(200);
  } else {
    res.status(400).send('Please provide an IP address.');
  }
});
```

6. **Start the Server:**

```javascript
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### Usage in Next.js

To use `nextjs-security` in a Next.js application, you will need to integrate it with API routes and custom server middleware.

1. **Create a Custom Server with Express.js:**

In your `server.js` file:

```javascript
const express = require('express');
const next = require('next');
const { requestLogger, blockIPMiddleware, logRequest } = require('nextjs-security');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use((req, res, next) => {
    logRequest(req, res, next, {
      saveEndpoints: [
        { method: 'POST', endpoint: '/api/*' },
        { method: 'GET', endpoint: '/api/*' },
      ],
      maxSize: 5 * 1024 * 1024,
      rateLimitConfig: { window: 15 * 60 * 1000, limit: 200 }
    });
  });

  server.use(blockIPMiddleware);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
```

2. **Use in Next.js API Routes:**

You can directly use the utilities within API routes for blocking or logging:

```javascript
import { logRequest, addIPToBlocklist, removeIPFromBlocklist } from 'nextjs-security';

export default function handler(req, res) {
  logRequest(req, res, () => {}, { saveEndpoints: [{ method: 'GET', endpoint: '/api/example' }] });

  if (req.method === 'POST') {
    const { ip } = req.body;
    addIPToBlocklist(ip);
    res.status(200).json({ message: 'IP blocked' });
  } else {
    res.status(200).json({ message: 'Hello from Next.js!' });
  }
}
```

## Logs and Configuration Files

- **`logs/blockedIps.json`**: Stores the list of blocked IPs.
- **`logs/rateLimit.json`**: Tracks request rates to enforce rate limiting.
- **`logs/requests.json`**: Stores detailed logs of all requests that match the configured endpoints and methods.

## Customization

You can customize the behavior of `nextjs-security` by modifying:

- **Rate Limit Settings**: Define the request window and limit.
- **Endpoints for Logging**: Specify which methods and endpoints should be logged.
- **Max Log File Size**: Set the maximum size for the log file before it is cleared.

## License

MIT License. 
