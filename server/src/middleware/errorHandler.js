import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  console.error(err.message); // no registrar datos del paciente
  res.status(500).json({ error: 'Error interno del servidor' });
}
