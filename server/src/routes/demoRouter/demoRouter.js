const {Router} = require('express');
const resetDatabase = require('../../handlers/demoHandlers/reset');
const demoRouter = Router();

/**
 * @swagger
 * /demo/health:
 *   get:
 *     summary: ✅ Ruta para mantener el servidor activo.
 *     description: Usamos esta ruta en conjunto con cron-job para mantener el servidor activo siguiendo un intervalo de request simples cada x minutos.<br><br>Útil para evitar el snooze-time, o tiempo de espera mientras el servidor se levanta de la suspensión por inactividad.
 *     tags:
 *       - Demo
 *     responses:
 *       200:
 *         description: El servidor responde con un mensaje para informar que todavía funciona, evitando el snooze time.<br><br>`message 'main router workin'`
 */

demoRouter.get('/health', (req, res) => { res.status(200).json( {message: 'main router working'} ) });

/**
 * @swagger
 * /demo/reset:
 *   patch:
 *     summary: 🔁 Resetea toda la base de datos.
 *     description: |
 *       # 🔁 Resetear sandbox
 *       Elimina `todos` los datos existentes y recrea las tablas con los datos semilla.
 * 
 *       > `🔧` Útil para limpiar el entorno de pruebas y volver a empezar.
 *     tags:
 *       - Demo
 *     responses:
 *       200:
 *         description: Base de datos reseteada exitosamente.
 *       500:
 *         description: Error interno del servidor
 */

demoRouter.patch('/reset', resetDatabase);

module.exports = demoRouter;