import type { FastifyInstance, FastifyRequest } from 'fastify';

const PUBLIC_PATHS = new Set(['/health', '/api/v1', '/api/v1/auth/login', '/api/v1/public/quote-estimator', '/api/v1/public/contact']);

const RESOURCE_ALIASES: Record<string, string> = {
  dashboard:'dashboard', leads:'leads', clients:'clients', enquiries:'enquiries', quotes:'quotes', projects:'projects',
  services:'settings', settings:'settings', approvals:'settings', jobs:'jobs', tasks:'tasks', employees:'employees', time:'time', materials:'materials', 'material-categories':'materials',
  inventory:'inventory', warehouses:'inventory', 'stock-movements':'inventory', vendors:'outsourcing', outsourcing:'outsourcing', expenses:'expenses',
  'expense-categories':'expenses', 'purchase-requests':'purchasing', 'purchase-orders':'purchasing', 'goods-receipts':'purchasing',
  installations:'installations', invoices:'invoices', payments:'payments', profitability:'reports', 'audit-logs':'audit', notifications:'dashboard',
};

function permissionFor(request: FastifyRequest) {
  if (request.url === '/api/v1/auth/me') return null;
  const parts = request.url.split('?')[0].split('/').filter(Boolean);
  const resource = RESOURCE_ALIASES[parts[2] ?? ''];
  if (!resource) return null;
  if (resource === 'dashboard' || parts[2] === 'notifications') return 'dashboard.view';
  if (resource === 'settings') return 'settings.write';
  return request.method === 'GET' || request.method === 'HEAD' ? `${resource}.read` : `${resource}.write`;
}

export async function registerAuthGuard(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (PUBLIC_PATHS.has(request.url.split('?')[0])) return;
    try { await request.jwtVerify(); } catch { return reply.unauthorized('Authentication required'); }
    const required = permissionFor(request);
    if (!required) return;
    const permissions = (request.user as { permissions?: string[] }).permissions ?? [];
    if (!permissions.includes(required)) return reply.forbidden(`Missing permission: ${required}`);
  });
}
