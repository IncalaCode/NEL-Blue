const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NELBlue Backend API",
      version: "1.0.0",
      description: "API documentation forNELBlue Backend API  endpoint",
    },
    servers: [
      {
        url: "https://NELblue.onrender.com/api", // Base URL for the API
      },
    ],
  },
  apis: ["./Routes/*.js"], // Scan all route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
