const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
  errorFormat: 'pretty',
});

prisma.$on('query', (e) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', { message: e.message });
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error', { message: e.message });
});

prisma.$on('info', (e) => {
  logger.info('Prisma Info', { message: e.message });
});

module.exports = prisma;
