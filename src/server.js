const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const prisma = require('./config/database');

let server;

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`API available at http://localhost:${config.port}${config.apiPrefix}`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: reason.message || reason });
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();
