# Kandy Ads Operations Platform — Master Task Plan

This is the single project task file for the repository. The public website lives in `frontend/`; the internal operations app lives in `admin/`; the API/database layer lives in `backend/`.

## 0. Workspace
- [x] Repository separated into `frontend/`, `admin/`, `backend/`.
- [x] Master task document is at repository root.
- [ ] Add shared development conventions and environment documentation.
- [ ] Add CI checks and production deployment documentation.

## 1. Platform Foundation
- [x] Backend Node.js + TypeScript + Fastify foundation.
- [x] MySQL + Prisma schema foundation.
- [x] Environment validation foundation.
- [ ] Prisma migrations and production database setup.
- [x] Authentication login/session foundation.
- [ ] Password reset/change workflow.
- [ ] Roles and permissions enforcement.
- [x] API validation, base error format, request logging and request IDs.
- [ ] Audit logging implementation.
- [x] Admin protected application shell, navigation and responsive layout.

## 2. Master Data / Settings
- [ ] Company profile/settings.
- [ ] Branch/location settings.
- [ ] Number sequences.
- [ ] Tax configuration and payment methods.
- [ ] Units of measure.
- [x] Service catalogue API foundation.
- [ ] Material categories.
- [ ] Expense categories.
- [ ] Status/workflow configuration.

## 3. Sales / CRM
### Leads
- [ ] Lead CRUD, search/filter/sort.
- [ ] Lead source and pipeline.
- [ ] Assign sales owner.
- [ ] Follow-up reminders.
- [ ] Notes, activity timeline and attachments.
- [ ] Convert lead to client/enquiry.

### Clients
- [x] API-backed client list/search.
- [x] Organized Clients feature module.
- [x] Client create workflow with reusable modal/form.
- [x] Client create API integration.
- [ ] Client edit/detail workflow.
- [ ] Contacts, phone, WhatsApp, email and address.
- [ ] Industry, payment terms, credit limit and status.
- [ ] Client notes/documents.
- [ ] Client project/quote/invoice history.

### Enquiries
- [x] Enquiry list/search API and admin screen foundation.
- [x] Enquiry create modal + client selection + validation + API create.
- [x] Source, requirement, site/location, target date and priority fields.
- [ ] Enquiry edit/detail workflow.
- [ ] Attachments.
- [ ] Convert enquiry to quotation.

### Quotations / Estimates
- [x] Quote list/search API and admin screen foundation.
- [x] Quote cost/margin calculation API foundation.
- [x] Quote create modal with client/enquiry selection and dynamic line items.
- [x] Service catalogue selector for quote lines.
- [ ] Quote edit/detail workflow.
- [ ] PDF generation and sharing.
- [ ] Client approval/rejection tracking.
- [ ] Convert accepted quote into project action.
- [ ] Integrate public quote estimator.

## 4. Delivery / Project Management
### Projects
- [x] Project list/search API and admin screen foundation.
- [x] Project create modal with client/accepted quote selection.
- [ ] Project edit/detail workflow.
- [ ] Project owner assignment.
- [x] Start/due dates and value fields.
- [ ] Status management.
- [ ] Jobs, tasks, materials, expenses, purchasing, outsourcing, time, installations, documents, invoices and profitability tabs.
- [ ] Project activity history.

### Jobs — Core Production Model
- [x] Job list/search API and admin screen foundation.
- [x] Job detail API foundation.
- [ ] Job CRUD/create modal and detail workflow.
- [x] Job/project/service linkage in API.
- [x] Internal / outsourced / mixed assignment field.
- [x] Revenue and estimated material/labour/outsourcing/expense cost fields.
- [ ] Actual cost calculation from production transactions.
- [ ] Gross profit/margin dashboard.
- [ ] Attachments, activity and completion approval.

### Tasks / Work Breakdown
- [x] Task list/search API and admin screen foundation.
- [ ] Tasks create/edit/detail workflow.
- [x] Job linkage and employee assignment fields in API.
- [x] Priority, dates, planned hours and status fields.
- [ ] Dependencies, checklists and subtasks.
- [ ] Notes, attachments and completion timestamp.
- [ ] Employee workload view.

## 5. Team / Labour
- [x] Employee list/search API and admin screen foundation.
- [ ] Employee master CRUD.
- [x] Department, employment type and internal hourly/daily costing fields.
- [ ] Skills and role management.
- [ ] Employee job assignments.
- [x] Time entry list/API foundation.
- [ ] Time entry create/edit/approval workflow.
- [ ] Automatic labour cost calculation.
- [ ] Planned vs actual hours.

## 6. Vendors / Outsourcing
- [ ] Vendor/supplier master.
- [ ] Contacts, category, capabilities and payment terms.
- [ ] Bank/payment details.
- [ ] Vendor documents.
- [ ] Outsource requests.
- [ ] Vendor selection, scope, quantity/specification and due date.
- [ ] Agreed cost and status workflow.
- [ ] Vendor deliverables/invoices.
- [ ] Push actual outsourcing cost to job/project profitability.

## 7. Materials / Inventory
- [ ] Materials master.
- [ ] Warehouses/locations.
- [ ] Stock by location.
- [ ] Reserved/available quantities.
- [ ] Job material requirements.
- [ ] Issue, return, consume and waste tracking.
- [ ] Stock ledger.
- [ ] Reorder alerts.

## 8. Purchasing
- [ ] Purchase requests and approvals.
- [ ] Purchase orders and line items.
- [ ] Vendor linkage.
- [ ] Expected delivery.
- [ ] Goods receipts and partial receipts.
- [ ] Inventory receipt integration.
- [ ] Supplier invoice linkage.

## 9. Expenses
- [ ] Project/job expenses.
- [ ] General business expenses.
- [ ] Categories, approval and receipts.
- [ ] Direct/general classification.
- [ ] Push approved direct cost into profitability.

## 10. Field Operations
- [ ] Installation orders.
- [ ] Site/contact details.
- [ ] Scheduling/team assignment.
- [ ] Vehicle/transport assignment.
- [ ] Installation workflow/status.
- [ ] Before/after photos and completion proof.

## 11. Finance
- [ ] Invoices.
- [ ] Invoice PDF.
- [ ] Payments.
- [ ] Partial payment allocation.
- [ ] Outstanding balances and overdue calculation.
- [ ] Job/project profitability.
- [ ] Estimate vs actual.
- [ ] Forecast/variance reporting.

## 12. Documents
- [ ] Generic attachment model.
- [ ] Secure uploads and access rules.
- [ ] Documents across clients, enquiries, quotes, projects, jobs, purchasing, expenses, vendors, invoices and installations.

## 13. Dashboard / Reports
- [x] Initial dashboard shell.
- [x] Initial dashboard summary API.
- [ ] Live jobs due/overdue.
- [ ] Live low-stock/purchase alerts.
- [ ] Revenue, expenses, profit and receivables.
- [ ] Employee workload.
- [ ] Upcoming installations.
- [ ] Full operational reports and exports.

## 14. Users / Security / Audit
- [x] Basic login/session handling.
- [ ] Users, roles and permissions.
- [ ] Action-level authorization.
- [ ] Activity/audit log.
- [ ] Financial/inventory change history.

## 15. Notifications
- [ ] Job assignment.
- [ ] Task due/overdue.
- [ ] Low stock.
- [ ] Purchase delivery.
- [ ] Installation reminders.
- [ ] Quote follow-ups.
- [ ] Invoice overdue.
- [ ] Approval notifications.
- [ ] In-app notification center.
- [ ] Email/WhatsApp integrations later.

## 16. Public Website Integration
- [ ] Website contact form → API lead/enquiry.
- [ ] Website quote estimator → enquiry/quote draft.
- [ ] UTM/source capture.
- [ ] Spam/rate limiting.
- [ ] Admin notifications.

## 17. Admin UX / Quality
- [x] Responsive admin shell foundation.
- [x] Reusable table component.
- [x] Organized feature-folder architecture started.
- [x] Reusable modal component.
- [x] Initial reusable entity-form styling.
- [x] Current live screens have loading/empty/error states.
- [ ] Toast feedback.
- [ ] Accessibility and keyboard support.

## 18. Backend API
- [x] REST foundation.
- [x] Request validation.
- [x] Pagination/filtering foundation.
- [x] Standard error responses.
- [ ] Authorization middleware.
- [ ] Transactions for stock and financial operations.
- [ ] OpenAPI documentation.

## 19. Database Integrity
- [x] Normalized Prisma schema foundation.
- [x] Foreign keys and unique constraints.
- [x] Decimal-safe money fields.
- [ ] Production migrations.
- [ ] Archive/soft-delete strategy.
- [ ] Transaction-safe stock/invoice/payment updates.
- [ ] Seed/demo data.
- [ ] Backup/restore plan.

## 20. Testing / Release
- [ ] Costing unit tests.
- [ ] Stock movement tests.
- [ ] API integration tests.
- [ ] Admin workflow tests.
- [ ] Production build checks.
- [ ] Deployment checklist.

## Suggested implementation phases
1. Foundation + auth + database.
2. CRM + enquiries + quotations.
3. Projects + jobs + tasks + employees + time.
4. Materials + inventory + purchasing + outsourcing + expenses.
5. Installations + finance + profitability.
6. Reports + notifications + website integration.
7. Phase 2: vehicles, advanced accounting, client portal and mobile field tools.
