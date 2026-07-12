// Swagger UI Configuration for Vendor Management API
module.exports = {
  // Swagger UI options
  swaggerOptions: {
    // API specification file
    spec: require('./vendor-management-openapi.yaml'),
    
    // UI Configuration
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      require('swagger-ui-dist').presets.apis,
      require('swagger-ui-dist').StandalonePreset
    ],
    layout: "StandaloneLayout",
    
    // Display options
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    docExpansion: "list",
    filter: true,
    maxDisplayedTags: 5,
    showRequestDuration: true,
    showCommonExtensions: true,
    
    // Try It Out options
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Add authentication token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    },
    responseInterceptor: (response) => {
      return response;
    },
    
    // Persist authorization
    persistAuthorization: true,
    withCredentials: true,
    
    // Supported HTTP methods
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    
    // Custom CSS
    customCss: `
      .swagger-ui .topbar { 
        background-color: #1a1a1a; 
      }
      .swagger-ui .topbar .wrapper {
        background-color: #1a1a1a;
        border-bottom: 1px solid #333;
      }
      .swagger-ui .info {
        margin: 20px 0;
      }
      .swagger-ui .info .title {
        color: #3b4151;
        font-size: 32px;
        font-weight: 600;
      }
      .swagger-ui .info .description {
        color: #606060;
        font-size: 14px;
        line-height: 1.6;
      }
      .swagger-ui .opblock {
        border-radius: 4px;
        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
      }
      .swagger-ui .opblock .opblock-summary {
        border-radius: 4px;
      }
      .swagger-ui .opblock .opblock-summary-description {
        color: #606060;
      }
      .swagger-ui .opblock .opblock-section-header {
        background-color: #f7f7f7;
        border-bottom: 1px solid #e7e7e7;
      }
      .swagger-ui .scheme-container {
        background-color: #f7f7f7;
        padding: 10px;
        border-radius: 4px;
      }
      .swagger-ui .model {
        background-color: #f7f7f7;
        border-radius: 4px;
      }
      .swagger-ui .model-title {
        color: #3b4151;
        font-size: 16px;
        font-weight: 600;
      }
      .swagger-ui .prop-type {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .response-col_status {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .response-col_description {
        color: #606060;
      }
      .swagger-ui table.headers thead tr th {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .parameters-col_description {
        color: #606060;
      }
      .swagger-ui .parameters-col_name {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .parameter__name {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .parameter__in {
        color: #606060;
      }
      .swagger-ui .parameter__type {
        color: #606060;
      }
      .swagger-ui .examples-select {
        margin-bottom: 10px;
      }
      .swagger-ui .examples-select label {
        color: #3b4151;
        font-weight: 600;
      }
      .swagger-ui .examples-select select {
        margin-top: 5px;
      }
    `,
    
    // Custom site title
    customSiteTitle: "Vendor Management API Documentation",
    
    // Callbacks
    onComplete: function() {
      console.log("Swagger UI loaded successfully");
    },
    onFailure: function(error) {
      console.error("Failed to load Swagger UI:", error);
    }
  },
  
  // Express middleware options
  expressOptions: {
    // Route for Swagger UI
    route: '/api-docs',
    
    // Route for API specification
    specRoute: '/api-docs/spec',
    
    // Enable/disable Swagger UI
    explorer: true,
    
    // Enable/disable API specification download
    swaggerOptions: {
      persistAuthorization: true,
    }
  }
};