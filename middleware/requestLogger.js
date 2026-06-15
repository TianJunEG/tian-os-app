import pinoHttp from 'pino-http';
import logger from '../config/logger.js';
import crypto from 'crypto';

export const requestLogger = pinoHttp({
  logger,
  genReqId(req) {
    return req.headers['x-request-id'] || crypto.randomUUID();
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
  },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Don't log health-check noise
  autoLogging: {
    ignore(req) { return req.url === '/health' || req.url === '/api/health'; },
  },
  serializers: {
    req(req) {
      return { method: req.method, url: req.url, id: req.id };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
