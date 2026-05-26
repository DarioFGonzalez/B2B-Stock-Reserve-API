const {Router} = require('express');
const mainRouter = Router();
const clientsRouter = require('./clientsRouter/clientsRouter');
const productsRouter = require('./productsRouter/productsRouter');
const invoicesRouter = require('./invoicesRouter/invoicesRouter');
const demoRouter = require('./demoRouter/demoRouter');

mainRouter.use('/demo', demoRouter);

mainRouter.use('/clients', clientsRouter);
mainRouter.use('/products', productsRouter);
mainRouter.use('/invoices', invoicesRouter);

module.exports = mainRouter;