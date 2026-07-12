const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const routes = require('./routes');
const { morganMiddleware, errorConverter, errorHandler } = require('./middleware');
const ApiError = require('./utils/ApiError');
const { HttpStatus } = require('./constants');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

app.use('/uploads', express.static(path.resolve(config.upload.path)));

app.use(routes);

app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
