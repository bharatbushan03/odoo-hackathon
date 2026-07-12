const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load the OpenAPI specification
const spec = YAML.load(path.join(__dirname, 'vendor-management-openapi.yaml'));

// Create Express app
const app = express();

// Serve the OpenAPI specification
app.get('/spec', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.send(spec);
});

// Serve JSON version of the specification
app.get('/spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

// Use swagger-ui-express middleware
app.use('/', swaggerUi.serve, swaggerUi.setup(spec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Vendor Management API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    displayOperationId: false,
    filter: true,
    showRequestDuration: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    maxDisplayedTags: 5,
    requestInterceptor: (request) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    },
  }
}));

const PORT = process.env.SWAGGER_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Swagger UI is running on http://localhost:${PORT}`);
  console.log(`API specification available at http://localhost:${PORT}/spec`);
  console.log(`JSON specification available at http://localhost:${PORT}/spec.json`);
});