import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { getDocumentQueue } from './document.queue';

/**
 * Crea el router del panel de BullMQ (bull-board).
 *
 * El router ya incluye el ExpressAdapter con su basePath configurado y se
 * debe montar en app.ts usando `app.use(basePath, router)`.
 *
 * Si QUEUE_DASHBOARD_TOKEN está definido, se exige el header
 * `Authorization: Bearer <token>`; de lo contrario el panel queda abierto
 * (útil en desarrollo local).
 */
export function createQueueDashboardRouter(): Router {
  const router = Router();

  const basePath = process.env.QUEUE_DASHBOARD_BASE_PATH ?? '/admin/queues';
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(basePath);

  createBullBoard({
    queues: [new BullMQAdapter(getDocumentQueue())],
    serverAdapter,
  });

  // Protección opcional por token para evitar exponer el panel en producción.
  const token = process.env.QUEUE_DASHBOARD_TOKEN;
  if (token) {
    router.use((req, _res, next) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) !== token) {
        const res = _res as {
          status: (code: number) => { json: (body: unknown) => void };
        };
        return res.status(401).json({ error: 'No autorizado' });
      }
      next();
    });
  }

  router.use('/', serverAdapter.getRouter());

  return router;
}
