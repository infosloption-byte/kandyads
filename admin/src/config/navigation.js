export const navigationGroups = [
  {
    label: 'COMMAND CENTER',
    items: [
      ['Dashboard', '/', 'dashboard.view'],
      ['Approvals', '/approvals', 'settings.write'],
    ],
  },
  {
    label: 'SALES & CRM',
    items: [
      ['Leads', '/leads', 'leads.read'],
      ['Clients', '/clients', 'clients.read'],
      ['Enquiries', '/enquiries', 'enquiries.read'],
      ['Quotes', '/quotes', 'quotes.read'],
    ],
  },
  {
    label: 'DELIVERY',
    items: [
      ['Projects', '/projects', 'projects.read'],
      ['Jobs', '/jobs', 'jobs.read'],
      ['Tasks', '/tasks', 'tasks.read'],
    ],
  },
  {
    label: 'PRODUCTION',
    items: [
      ['Materials', '/materials', 'materials.read'],
      ['Inventory', '/inventory', 'inventory.read'],
      ['Purchasing', '/purchasing', 'purchasing.read'],
      ['Vendors', '/vendors', 'outsourcing.read'],
      ['Outsourcing', '/outsourcing', 'outsourcing.read'],
      ['Installations', '/installations', 'installations.read'],
    ],
  },
  {
    label: 'TEAM & FINANCE',
    items: [
      ['Employees', '/employees', 'employees.read'],
      ['Time Tracking', '/time', 'time.read'],
      ['Expenses', '/expenses', 'expenses.read'],
      ['Invoices', '/invoices', 'invoices.read'],
      ['Profitability', '/profitability', 'reports.read'],
    ],
  },
  {
    label: 'ADMIN',
    items: [
      ['Reports', '/reports', 'reports.read'],
      ['Settings', '/settings', 'settings.write'],
    ],
  },
];

export function filterNavigation(groups, permissions = []) {
  const allowed = new Set(permissions);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(([, , permission]) => allowed.has(permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessPath(path, permissions = []) {
  const normalized = path.split('?')[0].replace(/^\//, '').split('/')[0] || 'dashboard';
  const allItems = navigationGroups.flatMap((group) => group.items);
  const item = allItems.find(([, route]) => (route.replace(/^\//, '') || 'dashboard') === normalized);
  return item ? permissions.includes(item[2]) : true;
}
