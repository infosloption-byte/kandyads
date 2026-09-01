import type { FastifyInstance, FastifyRequest } from 'fastify';

const PUBLIC_PATHS = new Set(['/health', '/api/v1', '/api/v1/auth/login']);

const RESOURCE_ALIASES: Record<string, string> = {
  dashboard: 'dashboard',
  leads: 'leads',
  clients: 'clients',
  enquiries: 'enquiries',
  quotes: 'quotes',
  projects: 'projects',
  services: 'settings',
  jobs: 'jobs',
  tasks: 'tasks',
  employees: 'employees',
  time: 'time',
  materials: 'materials',
  'material-categories': 'materials',
  warehouses: 'inventory',
  'stock-movements': 'inventory',
  vendors: 'outsourcing',
  outsourcing: 'outsourcing',
  expenses: 'expenses',
  'expense-categories': 'expenses',
  'purchase-requests': 'purchasing',
  'purchase-orders': 'purchasing',
  'goods-receipts': 'purchasing',
  installations: 'installations',
  invoices: 'invoices',
  payments: 'payments',
  profitability: 'reports',
};

function permissionFor(request: FastifyRequest) {
  if (request.url === '/api/v1/auth/me') return null;
  const path = request.url.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  const resource = RESOURCE_ALIASES[parts[2] ?? ''];
  if (!resource) return null;
  if (resource === 'dashboard') return 'dashboard.view';
  if (request.method === 'GET' || request.method === 'HEAD') return `${resource}.read`;
  return `${resource}.write`;
}

export async function registerAuthGuard(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0];
    if (PUBLIC_PATHS.has(path)) return;

    try {
      await request.jwtVerify();
    } catch {
      return reply.unauthorized('Authentication required');
    }

    const required = permissionFor(request);
    if (!required) return;

    const payload = request.user as { permissions?: string[] };
    const permissions = payload.permissions ?? [];
    if (!permissions.includes(required)) {
      return reply.forbidden(`Missing permission: ${required}`);
    }
  });
}
