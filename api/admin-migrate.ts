// Endpoint canónico (plano) para Vercel routing:
//   POST /api/admin-migrate?mode=dry-run|apply
// Este archivo evita problemas de fallback al SPA para rutas anidadas.
export { default } from './admin/migrate-handler.js';

