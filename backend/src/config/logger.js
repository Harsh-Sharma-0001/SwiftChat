// src/config/logger.js — Winston logger
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), simple()),
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
});

module.exports = logger;
