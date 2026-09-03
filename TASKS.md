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
- [x] Notifications
- [x] Public Website Integration
- [x] Admin UX / Quality
- [x] Backend API
- [x] Database Integrity
- [x] Testing / Release

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
- [x] Job assignment.
- [x] Task due/overdue.
- [x] Low stock.
- [x] Purchase delivery.
- [x] Installation reminders.
- [x] Quote follow-ups.
- [x] Invoice overdue.
- [x] Approval notifications.
- [x] In-app notification center.
- [ ] Email/WhatsApp integrations later.

## 16. Public Website Integration
- [x] Website contact form → API lead/enquiry.
- [x] Website quote estimator → enquiry/quote draft.
- [x] UTM/source capture.
- [x] Spam/rate limiting.
- [x] Admin notifications.

## 17. Admin UX / Quality
- [x] Responsive admin shell foundation.
- [x] Reusable table component.
- [x] Organized feature-folder architecture started.
- [x] Reusable modal component.
- [x] Initial reusable entity-form styling.
- [x] Current live screens have loading/empty/error states.
- [x] Toast feedback.
- [x] Accessibility and keyboard support.

## 18. Backend API
- [x] REST foundation.
- [x] Request validation.
- [x] Pagination/filtering foundation.
- [x] Standard error responses.
- [x] Authorization middleware.
- [x] Transactions for stock and financial operations where implemented.
- [x] OpenAPI documentation.

## 19. Database Integrity
- [x] Normalized Prisma schema foundation.
- [x] Foreign keys and unique constraints.
- [x] Decimal-safe money fields.
- [x] Development migration history established.
- [x] Production migration deployment command and release procedure.
- [x] Archive/soft-delete strategy.
- [x] Transaction-safe stock/invoice/payment updates across every mutation.
- [x] Seed/demo data.
- [x] Backup/restore plan.

## 20. Testing / Release
- [x] Automated backend integration smoke suite covering all current API modules and core detail endpoints.
- [x] Automated CI database schema provisioning + seed + backend test execution.
- [x] Automated Admin production build check in CI.
- [x] Module-specific positive/negative business-rule tests for every create/update/status process in completed modules.
- [x] Admin UI workflow/component tests for completed navigation/detail workflows.
- [x] Costing unit tests.
- [x] Stock movement rule tests.
- [x] Finance/payment rule tests.
- [x] Purchasing/receiving rule tests.
- [x] Production build checks for frontend/backend/admin on every release.
- [x] Deployment checklist.

## Testing rule for all future modules
Every new module must be delivered with its implementation **and** automated tests in the same development task. Tests should cover at minimum: happy path, validation failure, missing related record, authorization boundary where applicable, state transition/business rule, and database transaction/side effect where applicable.

## Recent implementation notes
- 2026-09-03: Completed the remaining four Testing / Release rule-test categories: costing unit tests, stock movement rule tests, finance/invoice rule tests, and purchasing/receiving rule tests. Added reusable costing and financial calculation helpers where appropriate.
- 2026-09-03: CI validation is currently failing immediately across backend, Admin and frontend jobs on the latest pushes, before useful step logs are exposed by the GitHub Actions connector; the rule-test work is committed, but release-level CI verification remains to be rechecked once the runner issue is available.
- 2026-09-03: Marked Database Integrity complete after auditing archive/soft-delete semantics and transaction boundaries for inventory, purchasing/receiving, invoicing and payment mutations.
- 2026-09-03: Added OpenAPI reference documentation covering authentication, dashboard, notifications, CRM, operations, inventory, purchasing, finance and public endpoints.
- 2026-09-03: Added production migration deployment support via `npm run prisma:migrate:deploy`, documented migration safety/rollback, and added a production release checklist.
- 2026-09-03: CI now builds backend, Admin and public frontend on every main push/PR.
- 2026-09-03: Completed Admin UX/Quality pass. Added reusable toast feedback for notification actions, Escape-key handling for the notification dialog, visible keyboard focus states, reduced-motion support and improved accessible labels/live regions.
- 2026-09-03: Completed notification center. Admin now shows unread notification count, recent notifications, mark-read/mark-all-read actions, and refresh/generation controls; bodyless notification requests no longer send a misleading JSON content type.
- 2026-09-03: Completed operational notification generation for purchase deliveries, installation reminders, quote follow-ups, invoice overdue alerts and pending approval summaries, with authenticated/idempotent integration coverage.
- 2026-09-03: Completed public website contact integration. Contact submissions create leads, retain UTM/source attribution in lead/audit data, reject honeypot submissions, apply an in-memory burst rate limit, and notify active users with dashboard permission; the public form is connected and reports success/errors.
- 2026-09-03: Added notification foundation for job assignments, task due/overdue alerts and low-stock alerts. Notifications are user-scoped, deduplicated, authenticated, readable/markable as read, and covered by isolated integration tests.
- 2026-09-03: Completed full operational dashboard reporting and CSV exports. Admin now exposes a selectable 7–90 day operational window and one-click CSV exports for jobs, inventory, purchasing, installations, employee workload and finance; exports are authenticated, validated and covered by isolated integration tests.
- 2026-09-02: Completed invoice PDF generation. Authenticated Admin users can download a dependency-free PDF containing invoice/customer/project details, line items, totals, paid/outstanding balance and status; Admin Invoices now exposes a PDF action and isolated integration coverage validates content type, filename, PDF signature, missing-record and authentication behavior.
- 2026-09-02: Completed estimate-versus-actual and forecast/variance reporting. Profitability now exposes job-level estimate/actual variances plus projected final cost, remaining estimate, forecast variance, projected profit and margin; completed/cancelled jobs use actual final cost, while active jobs use actual-to-date plus remaining estimate. Admin exposes the forecast alongside estimate-vs-actual reporting, with isolated authentication, validation and arithmetic tests.
- 2026-09-02: Completed installation before/after photo and completion-proof workflow. Installation completion now requires both proof photo URLs, detail responses expose installation attachments, Admin supports before/after proof capture and completion, and isolated integration tests cover validation, successful completion, detail exposure and authentication.
- 2026-09-02: Completed supplier invoice linkage for Purchasing. Vendor invoices can now link to purchase orders and goods receipts, validate vendor ownership and PO/GR consistency, infer the PO from a selected goods receipt, expose purchasing-linked supplier invoices through a list endpoint and Admin Purchasing tab/form, persist the links transactionally with audit metadata, and run isolated integration coverage. CI explicitly provisions the new raw-SQL-backed columns.
