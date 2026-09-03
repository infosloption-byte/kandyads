# Kandy Ads — Master Task Plan

- [x] Workspace
- [x] Platform Foundation
- [x] Master Data / Settings
- [x] Sales / CRM
- [x] Delivery / Project Management
- [x] Team / Labour
- [x] Vendors / Outsourcing
- [x] Materials / Inventory
- [x] Purchasing
- [x] Expenses
- [x] Field Operations
- [x] Finance
- [x] Documents
- [x] Dashboard / Reports
- [x] Users / Security / Audit
- [ ] Notifications
- [ ] Public Website Integration
- [ ] Admin UX / Quality
- [ ] Backend API
- [ ] Database Integrity
- [ ] Testing / Release

## 13. Dashboard / Reports
- [x] Live jobs due/overdue.
- [x] Low-stock and purchase alerts.
- [x] Revenue / expenses / profit / receivables.
- [x] Employee workload.
- [x] Upcoming installations.
- [x] Full operational reports and exports.

## 14. Users / Security / Audit
- [x] Basic login/session handling.
- [x] Users, roles and permissions.
- [x] Action-level authorization.
- [x] Activity/audit log.
- [x] Financial/inventory change history.

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
- [x] Website quote estimator → enquiry/quote draft.
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
- [x] Authorization middleware.
- [x] Transactions for stock and financial operations where implemented.
- [ ] OpenAPI documentation.

## 19. Database Integrity
- [x] Normalized Prisma schema foundation.
- [x] Foreign keys and unique constraints.
- [x] Decimal-safe money fields.
- [x] Development migration history established.
- [ ] Production migrations.
- [ ] Archive/soft-delete strategy.
- [ ] Transaction-safe stock/invoice/payment updates across every mutation.
- [x] Seed/demo data.
- [ ] Backup/restore plan.

## 20. Testing / Release
- [x] Automated backend integration smoke suite covering all current API modules and core detail endpoints.
- [x] Automated CI database schema provisioning + seed + backend test execution.
- [x] Automated Admin production build check in CI.
- [x] Module-specific positive/negative business-rule tests for every create/update/status process in completed modules.
- [x] Admin UI workflow/component tests for completed navigation/detail workflows.
- [ ] Costing unit tests.
- [ ] Stock movement rule tests.
- [ ] Finance/payment rule tests.
- [ ] Purchasing/receiving rule tests.
- [ ] Production build checks for frontend/backend/admin on every release.
- [ ] Deployment checklist.

## Testing rule for all future modules
Every new module must be delivered with its implementation **and** automated tests in the same development task. Tests should cover at minimum: happy path, validation failure, missing related record, authorization boundary where applicable, state transition/business rule, and database transaction/side effect where applicable.

## Recent implementation notes
- 2026-09-03: Completed full operational dashboard reporting and CSV exports. Admin now exposes a selectable 7–90 day operational window and one-click CSV exports for jobs, inventory, purchasing, installations, employee workload and finance; exports are authenticated, validated and covered by isolated integration tests.
- 2026-09-02: Completed invoice PDF generation. Authenticated Admin users can download a dependency-free PDF containing invoice/customer/project details, line items, totals, paid/outstanding balance and status; Admin Invoices now exposes a PDF action and isolated integration coverage validates content type, filename, PDF signature, missing-record and authentication behavior.
- 2026-09-02: Completed estimate-versus-actual and forecast/variance reporting. Profitability now exposes job-level estimate/actual variances plus projected final cost, remaining estimate, forecast variance, projected profit and margin; completed/cancelled jobs use actual final cost, while active jobs use actual-to-date plus remaining estimate. Admin exposes the forecast alongside estimate-vs-actual reporting, with isolated authentication, validation and arithmetic tests.
- 2026-09-02: Completed installation before/after photo and completion-proof workflow. Installation completion now requires both proof photo URLs, detail responses expose installation attachments, Admin supports before/after proof capture and completion, and isolated integration tests cover validation, successful completion, detail exposure and authentication.
- 2026-09-02: Completed supplier invoice linkage for Purchasing. Vendor invoices can now link to purchase orders and goods receipts, validate vendor ownership and PO/GR consistency, infer the PO from a selected goods receipt, expose purchasing-linked supplier invoices through a list endpoint and Admin Purchasing tab/form, persist the links transactionally with audit metadata, and run isolated integration coverage. CI explicitly provisions the new raw-SQL-backed columns.
