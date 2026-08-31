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
- [ ] Authentication, password hashing, sessions/JWT and logout.
- [ ] Roles and permissions.
- [x] API validation, base error format and request logging foundation.
- [ ] Audit logging for sensitive changes.
- [x] Admin protected-structure/app shell foundation, navigation and responsive layout.

## 2. Master Data / Settings
- [ ] Company profile and settings.
- [ ] Branch/location settings.
- [ ] Number sequences for clients, enquiries, quotes, projects, jobs, POs, invoices and expenses.
- [ ] Tax configuration and payment methods.
- [ ] Units of measure.
- [ ] Service catalogue.
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
- [x] Initial API-backed client list/search screen.
- [x] Client list/search API foundation.
- [ ] Company/client master CRUD.
- [ ] Contacts, phone, WhatsApp, email and address.
- [ ] Industry, payment terms, credit limit and status.
- [ ] Client notes and documents.
- [ ] Client project/quote/invoice history.

### Enquiries
- [ ] Enquiry number and source.
- [ ] Requirement, requested services, site/location and target date.
- [ ] Priority, owner and status.
- [ ] Attachments.
- [ ] Convert enquiry to quotation.

### Quotations / Estimates
- [ ] Quote header and line items.
- [ ] Service/product, quantity, unit, rate, discount, tax and total.
- [ ] Internal expected material, labour, outsourcing and expense costs.
- [ ] Expected margin.
- [ ] Quote terms, validity and status.
- [ ] PDF generation and sharing.
- [ ] Client approval/rejection tracking.
- [ ] Convert accepted quote into project.
- [ ] Integrate public quote estimator.

## 4. Delivery / Project Management
### Projects
- [ ] Project master and numbering.
- [ ] Client, source quote/enquiry and project owner.
- [ ] Start/due dates, value and status.
- [ ] Project overview dashboard.
- [ ] Jobs, tasks, materials, expenses, purchases, outsourcing, time, installations, documents, invoices and profitability views.
- [ ] Project activity history.

### Jobs — Core Production Model
- [ ] Job number and project linkage.
- [ ] Service, title, description, priority and dates.
- [ ] Internal / outsourced / mixed assignment.
- [ ] Revenue allocated to job.
- [ ] Estimated and actual material cost.
- [ ] Estimated and actual labour cost.
- [ ] Estimated and actual outsourcing cost.
- [ ] Estimated and actual other/direct expense.
- [ ] Gross profit and margin.
- [ ] Attachments, activity and completion approval.

### Tasks / Work Breakdown
- [ ] Tasks inside jobs.
- [ ] Employee assignment.
- [ ] Priority and dates.
- [ ] Estimated vs actual hours.
- [ ] Dependencies, checklists/subtasks and status.
- [ ] Notes, attachments and completion timestamp.
- [ ] Employee workload view.

## 5. Team / Labour
- [ ] Employee master and employee codes.
- [ ] Contact information, role, department and employment type.
- [ ] Join date, active/inactive state and skills.
- [ ] Internal hourly/daily costing rates.
- [ ] Employee job assignments and workload.
- [ ] Time entries linked to employee + project + job + task.
- [ ] Approve/edit/reject time entries.
- [ ] Automatic labour cost calculation.
- [ ] Planned vs actual hours.

## 6. Vendors / Outsourcing
### Vendors
- [ ] Vendor/supplier master.
- [ ] Contacts, category, capabilities and payment terms.
- [ ] Bank/payment details.
- [ ] Status, notes and documents.

### Outsourced Work
- [ ] Outsource request linked to job.
- [ ] Vendor, scope, quantity/specification and due date.
- [ ] Agreed cost and status workflow.
- [ ] Vendor deliverables and attachments.
- [ ] Vendor invoice linkage.
- [ ] Push actual outsourcing cost to job/project profitability.

## 7. Materials / Inventory
### Materials
- [ ] SKU/code, name, category and unit.
- [ ] Standard cost and optional default selling price.
- [ ] Preferred supplier.
- [ ] Reorder/minimum stock levels.
- [ ] Notes/specifications and active state.

### Warehouses / Stock
- [ ] Warehouse/location master.
- [ ] Stock by location.
- [ ] On-hand, reserved and available quantities.
- [ ] Reorder alerts and stock ledger.

### Job Consumption
- [ ] Material requirements per job.
- [ ] Required, reserved, issued, consumed, returned and wasted quantities.
- [ ] Link movements to project/job.
- [ ] Calculate actual material cost.

### Stock Movements
- [ ] Purchase receipt.
- [ ] Stock issue.
- [ ] Return.
- [ ] Transfer.
- [ ] Adjustment.
- [ ] Waste/scrap.
- [ ] Immutable movement history.

## 8. Purchasing
- [ ] Purchase requests and approvals.
- [ ] Purchase orders and line items.
- [ ] Vendor/supplier linkage.
- [ ] Expected delivery.
- [ ] Goods receipts and partial receipts.
- [ ] Purchase price history.
- [ ] Inventory receipt integration.
- [ ] Supplier bill/invoice linkage.

## 9. Expenses
### Project / Job Expenses
- [ ] Expense record and category.
- [ ] Project/job/employee/vendor linkage.
- [ ] Date, amount and payment method.
- [ ] Receipt attachment.
- [ ] Approval workflow.
- [ ] Direct/general classification.
- [ ] Push approved direct cost into profitability.

### General Business Expenses
- [ ] Rent, utilities, software, communications, office supplies, marketing and other operating costs.
- [ ] Approval and monthly/annual reporting.

## 10. Field Operations
### Installations
- [ ] Installation order linked to project/job.
- [ ] Site/contact details.
- [ ] Scheduled time and assigned team.
- [ ] Vehicle/transport assignment.
- [ ] Status: Scheduled, Confirmed, En Route, On Site, Completed, Rescheduled, Cancelled.
- [ ] Before/after photos, notes and client confirmation.

### Vehicles / Transport (Phase 2)
- [ ] Vehicle master, registration, type and capacity.
- [ ] Driver/team assignment.
- [ ] Trips, mileage, fuel, maintenance and costs.

## 11. Finance
### Invoices
- [ ] Invoice numbering and client/project linkage.
- [ ] Invoice lines, tax, discounts and totals.
- [ ] Due date and status.
- [ ] PDF generation.

### Payments / Receivables
- [ ] Payment entry and invoice allocation.
- [ ] Partial payments.
- [ ] Outstanding balance.
- [ ] Overdue calculation.
- [ ] Receivables dashboard.

### Profitability
- [ ] Job revenue minus material/labour/outsourcing/direct expense.
- [ ] Project revenue vs total cost.
- [ ] Gross profit and margin.
- [ ] Estimate vs actual.
- [ ] Budget/forecast variance.

## 12. Documents
- [ ] Generic attachment model.
- [ ] Client, enquiry, quote, project, job, purchase, expense, vendor, invoice and installation documents.
- [ ] Secure upload/access rules.

## 13. Dashboard / Reports
- [x] Initial admin dashboard shell and operational cards.
- [x] Initial dashboard summary API endpoint.
- [ ] Active projects and jobs in production from live data.
- [ ] Jobs due/overdue.
- [ ] Pending quotes and conversion rate.
- [ ] Revenue, expenses, profit and receivables.
- [ ] Low stock and pending purchase alerts from live inventory.
- [ ] Outsourced jobs.
- [ ] Employee workload.
- [ ] Upcoming installations.
- [ ] Sales, client, service, project, job, stock, material, labour, outsourcing, expense, invoice and receivables reports.
- [ ] Management summary exports.

## 14. Users / Security / Audit
- [ ] Users, roles and permissions.
- [ ] Protected routes and action-level authorization.
- [ ] Login/logout security.
- [ ] Activity/audit log.
- [ ] Financial and inventory change history.

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
- [ ] Admin notification for new leads/enquiries.
- [ ] Client upload support.

## 17. Admin UX / Quality
- [x] Responsive admin shell foundation.
- [x] Tables with search/filter foundation.
- [ ] Full CRUD form validation and useful errors.
- [ ] Confirmation before destructive actions.
- [ ] Loading/empty/error states across every module.
- [ ] Toast feedback.
- [ ] Keyboard/accessibility support.

## 18. Backend API
- [x] REST API foundation.
- [x] Request schema validation foundation.
- [x] Basic pagination/filtering on clients.
- [x] Consistent base error response.
- [ ] Authentication/authorization middleware.
- [ ] Database transactions for financial and stock operations.
- [ ] Logging/monitoring hardening.
- [ ] API documentation.

## 19. Database Integrity
- [x] Normalized relational schema foundation.
- [x] Foreign keys and unique constraints in Prisma schema.
- [x] Decimal-safe money fields in schema.
- [ ] Time/date conventions review.
- [ ] Archive/soft-delete strategy where appropriate.
- [ ] Transaction-safe stock/invoice/payment updates.
- [ ] Migrations and seed data.
- [ ] Backup/restore plan.

## 20. Testing / Release
- [ ] Unit tests for costing.
- [ ] Unit tests for stock movements.
- [ ] API integration tests.
- [ ] Admin critical workflow tests.
- [ ] Production build checks.
- [ ] Deployment checklist.

## Suggested implementation phases
1. Foundation + auth + database.
2. CRM + enquiries + quotations.
3. Projects + jobs + tasks + employees + time.
4. Materials + inventory + purchasing + outsourcing + expenses.
5. Installations + finance + profitability.
6. Reports + notifications + website integration.
7. Phase 2 operational enhancements: vehicles, advanced accounting, client portal and mobile field tools.
