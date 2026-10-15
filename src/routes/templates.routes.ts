import { NextFunction, Request, Response, Router } from 'express';
import { getDocumentTemplate } from '../domain/templates';

const router = Router();

function validateDocumentTypeParam(req: Request, res: Response, next: NextFunction): void {
  const { tipoDocumento } = req.params;
  if (!tipoDocumento || !/^[A-Za-z0-9_]+$/.test(tipoDocumento)) {
    res.status(400).json({ error: 'Tipo de documento inválido' });
    return;
  }
  next();
}

router.get('/:tipoDocumento', validateDocumentTypeParam, (req: Request, res: Response) => {
  const template = getDocumentTemplate(req.params.tipoDocumento);
  if (!template) {
    return res.status(404).json({ error: 'Plantilla no encontrada' });
  }
  return res.json(template);
});

export default router;
