# Kandy Ads Operations Platform — Master Task Plan

This is the single project task file for the repository. The public website lives in `frontend/`; the internal operations app lives in `admin/`; the API/database layer lives in `backend/`.

## 0. Workspace
- [x] Repository separated into `frontend/`, `admin/`, `backend/`.
- [x] Add shared development conventions and environment documentation.
- [x] Master task document is at repository root.
- [x] Add CI checks for backend integration tests and Admin production build.
- [x] Add production deployment documentation.

## 1. Platform Foundation
- [x] Backend Node.js + TypeScript + Fastify foundation.
- [x] MySQL + Prisma schema foundation.
- [x] Environment validation foundation.
- [x] Development Prisma migration and local database setup.
- [x] Authentication login/session foundation.
- [x] Password reset/change workflow.
- [x] Roles and permissions enforcement.
- [x] API validation, base error format, request logging and request IDs.
- [x] Audit logging implementation.
- [x] Admin protected application shell, navigation and responsive layout.

## 2. Master Data / Settings
- [x] Company profile/settings.
- [x] Branch/location settings.
- [x] Number sequences.
- [x] Tax configuration and payment methods.
- [x] Units of measure.
- [x] Service catalogue API foundation.
- [x] Material categories API foundation.
- [x] Expense categories.
- [x] Status/workflow configuration.

## 3. Sales / CRM
### Leads
- [x] Lead CRUD, search/filter foundation.
- [x] Lead source and pipeline.
- [x] Assign sales owner.
- [x] Follow-up reminders and due/upcoming filtering.
- [x] Notes and activity timeline foundation.
- [x] Lead detail/edit workflow.
- [x] Convert lead to client/enquiry.

### Clients
- [x] API-backed client list/search.
- [x] Organized Clients feature module.
- [x] Client create workflow with reusable modal/form.
- [x] Client create API integration.
- [x] Client edit/detail workflow.
- [x] Contacts, phone, WhatsApp, email and address fields.
- [x] Industry, payment terms, credit limit and status fields.
- [x] Client notes.
- [x] Client documents.
- [x] Client project/quote/invoice history detail view.

### Enquiries
- [x] Enquiry list/search API and admin screen foundation.
- [x] Enquiry create modal + client selection + validation + API create.
- [x] Source, requirement, site/location, target date and priority fields.
- [x] Enquiry edit/detail workflow.
- [x] Attachments.
- [x] Convert enquiry to quotation.

### Quotations / Estimates
- [x] Quote list/search API and admin screen foundation.
- [x] Quote cost/margin calculation API foundation.
- [x] Quote create modal with client/enquiry selection and dynamic line items.
- [x] Service catalogue selector for quote lines.
- [x] Quote edit/detail workflow.
- [x] PDF generation and sharing.
- [x] Client approval/rejection tracking.
- [x] Convert accepted quote into project action.
- [x] Integrate public quote estimator.

## 4. Delivery / Project Management
### Projects
- [x] Project list/search API and admin screen foundation.
- [x] Project create modal with client/accepted quote selection.
- [x] Project detail view and related-record drill-down.
- [x] Project edit/detail workflow.
- [x] Project owner assignment field.
- [x] Start/due dates and value fields.
- [x] Status management rules.
- [x] Related jobs, expenses, purchasing, installations, invoices and profitability visibility.
- [x] Activity history.

### Jobs — Core Production Model
- [x] Job list/search API and admin screen foundation.
- [x] Job detail API and Admin detail screen.
- [x] Job create workflow.
- [x] Job/project/service linkage in API.
- [x] Internal / outsourced / mixed assignment field.
- [x] Revenue and estimated material/labour/outsourcing/expense cost fields.
- [x] Actual cost calculation from production transactions.
- [x] Gross profit/margin dashboard.
- [x] Attachments.
- [x] Activity audit endpoint.
- [x] Completion approval workflow.

### Tasks / Work Breakdown
- [x] Task list/search API and admin screen foundation.
- [x] Task creation inside Job detail.
- [x] Job linkage and employee assignment fields in API.
- [x] Priority, dates, planned hours and status fields.
- [x] Task edit/detail workflow.
- [x] Dependencies, checklists and subtasks.
- [x] Notes, attachments and completion timestamp.
- [x] Employee workload view.

## 5. Team / Labour
- [x] Employee list/search API and admin screen foundation.
- [x] Employee master CRUD.
- [x] Department, employment type and internal hourly/daily costing fields.
- [x] Skills and role management.
- [x] Employee job assignments.
- [x] Time entry list/API foundation.
- [x] Job-level time-entry posting.
- [x] Time entry edit/approval workflow.
- [x] Automatic labour cost calculation.
- [x] Planned vs actual hours reporting.

## 6. Vendors / Outsourcing
- [x] Vendor/supplier master foundation.
- [x] Contacts, category, capabilities and payment terms fields.
- [x] Bank/payment details field.
- [x] Vendor documents.
- [x] Outsource requests/order foundation.
- [x] Vendor selection, scope, quantity/specification and due date.
- [x] Agreed cost and status workflow fields.
- [ ] Vendor deliverables/invoices.
- [x] Push actual outsourcing cost to job/project profitability.

## 7. Materials / Inventory
- [x] Materials master API.
- [x] Materials admin list/search and create workflow.
- [x] Material categories API.
- [x] Warehouses API and admin create workflow.
- [x] Stock movement API and admin posting workflow.
- [x] Stock by material/on-hand summary foundation.
- [x] Reserved/available quantities.
- [x] Job material requirements workflow foundation.
- [x] Issue, return and waste transaction endpoints.
- [x] Issue stock validation.
- [x] Full stock ledger/reporting.
- [x] Reorder alerts.

## 8. Purchasing
- [x] Purchase requests and line items foundation.
- [x] Purchase request approval workflow.
- [x] Purchase orders and line items.
- [x] Vendor linkage.
- [x] Expected delivery.
- [x] Goods receipts and partial receipts foundation.
- [x] Inventory receipt integration.
- [ ] Supplier invoice linkage.

## 9. Expenses
- [x] Project/job expenses foundation.
- [x] General business expense model foundation.
- [x] Categories, approval/status and receipts fields.
- [x] Direct/general classification.
- [x] Push approved direct cost into profitability.

## 10. Field Operations
- [x] Installation orders foundation.
- [x] Site/contact details.
- [x] Scheduling/team assignment fields.
- [x] Vehicle/transport assignment field.
- [x] Installation workflow/status foundation.
- [ ] Before/after photos and completion proof workflow.

## 11. Finance
- [x] Invoices foundation.
- [ ] Invoice PDF.
- [x] Payments foundation.
- [x] Partial payment calculation.
- [x] Outstanding balance calculation.
- [x] Job/project profitability.
- [ ] Estimate vs actual reporting.
- [ ] Forecast/variance reporting.

## 12. Documents
- [x] Generic attachment model.
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
- 2026-09-02: Added vendor detail and document management using the existing generic attachment system, including Vendor document registration/list/detail exposure and isolated authentication, missing-record and validation tests.
- 2026-09-02: Added configurable status/workflow management for quotes, enquiries, projects, jobs and tasks. Workflow transitions are stored in a version-controlled raw-SQL table, exposed through authorized Admin settings APIs/UI, audited transactionally, loaded into the existing runtime transition rules at startup, and covered by isolated integration tests without removing shared seeded configuration.
- 2026-09-02: Added tax configuration, payment-method cataloguing, units of measure and expense-category management with validation, duplicate protection, Admin controls, and isolated integration tests. New raw-SQL-backed tables are explicitly provisioned in CI.
- 2026-09-02: Added company profile settings plus branch/location management and transactional number sequences, including version-controlled raw-SQL migrations, Admin controls, authorization/validation coverage and audit side effects for number allocation.
- 2026-09-02: Added a single-row Company Settings profile with validated API read/update, transactional audit logging, Admin Settings UI and version-controlled database migration. CI explicitly provisions the raw-SQL-backed settings table.
- 2026-09-02: Added shared development conventions and environment documentation covering repository layout, local setup, environment variables, test isolation, database-change conventions and release commands.
- 2026-09-02: Added production deployment documentation covering frontend/Admin/backend topology, production environment configuration, migration safety, release verification and rollback guidance.
- 2026-09-02: Updated the backend test script to disable test-file concurrency because the integration suite shares a database and otherwise permits cross-file fixture races. The inventory workflow passed in isolation while intermittently failing in the full suite before this guard was added.
- 2026-09-02: Added a version-controlled Prisma migration for the generic `Attachment` table so client-document registration/listing works against a database created from the repository schema.
- 2026-09-02: Attachment creation already performs the attachment insert and `ATTACHMENT_ADDED` audit entry in one transaction, with the created attachment ID recorded in `afterJson`; the audit failure was a consequence of the missing attachment table preventing the transaction from completing.
- 2026-09-02: Updated CI test-database provisioning to use the complete Prisma schema before seeding, avoiding a fresh-database failure caused by the repository not yet containing a complete historical migration chain.
- 2026-09-02: The latest recorded backend integration run was 49/51 passing; the two failures were both in `attachment-workflows.test.ts` and were caused by the missing `attachment` table and the resulting absence of its audit record.
- 2026-09-02: Implemented authenticated password-change workflow with current-password verification, new-password validation, transactional credential update and `PASSWORD_CHANGED` audit entry; added `auth-password.test.ts` covering authentication boundary, validation failure, successful credential replacement and audit side effect.
- 2026-09-02: Added `rbac-workflows.test.ts` covering user/role/permission administration boundaries, role permission replacement validation/transaction behavior, and separate read-versus-write authorization enforcement.
- 2026-09-02: Fixed five integration failures (53/58): enquiry workflow tests now use isolated records rather than shared seeded enquiries, password validation tests assert structured validation details, and RBAC action-level tests use a dedicated read-only role so concurrent tests cannot mutate authorization state.
- 2026-09-02: Fixed the final enquiry workflow test failure by aligning its detail assertion with the Prisma relation shape: `quote` is a single nullable related record, not an array.
- 2026-09-02: Added centralized audit querying with `audit.read` authorization, transaction-bound inventory `STOCK_MOVEMENT_CREATED` history, financial `INVOICE_CREATED` and `PAYMENT_POSTED` before/after snapshots, plus `audit-workflows.test.ts` covering authorization, filtering, happy paths, invalid related records and transaction side effects.
- 2026-09-02: Added job audit/activity history for job creation, status changes and production transactions, plus an explicit job completion approval endpoint that requires REVIEW status and blocks approval while tasks remain open; added `job-activity-approval.test.ts` coverage and exposed the workflow through the Admin API client.
- 2026-09-02: Added task dependencies, circular-dependency protection, required checklists and subtasks with same-job validation and completion blockers. The implementation uses the dedicated task-structure tables while preserving the stable Prisma schema/client path.
- 2026-09-02: Completed task notes, task attachment visibility/registration and completion timestamp coverage. Task notes are stored in a dedicated nullable `Task.notes` column; task detail/list responses expose notes and attachments, and the Admin task form/detail UI supports editing notes and registering URL-backed attachments.
- 2026-09-02: Added the Employee workload API and Admin view. Workload groups active employee-assigned tasks with planned/actual/remaining hours, overdue counts, optional date-window filtering and employee filtering; actual hours are derived from logged task time entries when present, and the integration tests use isolated employee/job fixtures to avoid cross-suite mutation races.
- 2026-09-02: Added normalized employee role and skill catalogues with employee capability assignment, 1–5 proficiency levels, inactive-related-record validation, transactional replacement and audit history; added the Admin Skills & roles screen and isolated capability integration tests. The raw-SQL-backed tables are also provisioned explicitly in CI because the repository uses `db push` against the stable Prisma schema.
- 2026-09-02: Added the planned-versus-actual hours API/report page with date and employee filters, completed-task inclusion, logged-time variance calculation, and isolated integration tests covering missing employees, invalid ranges and authorization boundaries.
- 2026-09-02: Added enquiry attachment support to the detail API/Admin UI using the existing generic attachment system, with isolated integration coverage for empty/detail state, URL-backed registration, listing, missing related records and authorization boundaries.
- 2026-09-02: Added the public quote estimator with server-side indicative pricing ranges, a public `/quote` flow that collects customer/service details, and a transactional path that creates or reuses a client plus enquiry and draft quote; added integration coverage for unauthenticated access, validation, pricing calculation and transaction side effects.
- 2026-09-02: Added job attachment exposure in the Job detail API plus a dedicated Admin Job Attachments view using the existing generic attachment system; integration tests use an isolated Job fixture and cover missing-job and authentication boundaries.

## Suggested implementation phases
1. Foundation +... (truncated)