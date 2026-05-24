const express = require('express');
const cors = require('cors');
const server = express();
const pool = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const mainRouter = require('./routes/mainRouter');

server.use( cors() );
server.use( express.json() );

server.use( (req, res, next) => {
    if (!req.pool) {
    return res.status(500).json({ error: 'Database connection unavailable' });
}
    req.pool = pool;
    next();
})

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

server.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application-json');
    res.send(swaggerSpec);
})

server.use( mainRouter );

module.exports = server;