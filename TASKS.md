# Kandy Ads Operations Platform — Master Task Plan

## 0. Project Structure & Architecture
- [ ] Convert repository into a 3-application workspace:
  - [ ] `frontend/` — existing public Kandy Ads React/Vite website
  - [ ] `admin/` — new React admin/operations platform
  - [ ] `backend/` — new Node.js API
- [ ] Preserve the public website routes and production assets during the migration.
- [ ] Add root workspace documentation and separate environment examples for each app.
- [ ] Add shared conventions for TypeScript, formatting, validation, API errors, logging and IDs.
- [ ] Add database/migrations documentation.

## 1. Platform Foundation
- [ ] Define application configuration and environments: development, staging, production.
- [ ] Backend: Node.js + TypeScript + API framework.
- [ ] Database: MySQL + ORM/migrations.
- [ ] Authentication: secure login, password hashing, session/JWT strategy, refresh/logout.
- [ ] Authorization: roles + permissions.
- [ ] Admin: protected routes, app shell, sidebar, top bar, profile/session handling.
- [ ] Shared API client, request validation, error handling and loading states.
- [ ] Audit logging for sensitive changes.

## 2. Master Data / Settings
- [ ] Company profile/settings.
- [ ] Branch/location settings.
- [ ] Numbering/sequence settings: clients, enquiries, quotes, projects, jobs, purchase orders, invoices, expenses.
- [ ] Tax/settings framework.
- [ ] Payment methods.
- [ ] Units of measure.
- [ ] Service catalogue.
- [ ] Material categories.
- [ ] Expense categories.
- [ ] Job statuses, task statuses and workflow settings.

## 3. CRM — Leads
- [ ] Lead list/search/filter/sort.
- [ ] Lead create/edit/view.
- [ ] Lead source.
- [ ] Lead status pipeline: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost.
- [ ] Assign lead to staff.
- [ ] Follow-up date/reminder.
- [ ] Notes and activity timeline.
- [ ] Attachments.
- [ ] Convert lead to client/enquiry.

## 4. CRM — Clients
- [ ] Client/company master.
- [ ] Client contacts.
- [ ] Phone/WhatsApp/email/address.
- [ ] Industry.
- [ ] Payment terms.
- [ ] Credit limit.
- [ ] Client status.
- [ ] Client notes.
- [ ] Client project history.
- [ ] Client quote history.
- [ ] Client invoice/payment summary.
- [ ] Client document attachments.

## 5. Enquiries
- [ ] Enquiry number and client linkage.
- [ ] Source: website, WhatsApp, phone, referral, walk-in, sales.
- [ ] Requirement description.
- [ ] Requested service(s).
- [ ] Site/location.
- [ ] Target date.
- [ ] Priority.
- [ ] Sales owner.
- [ ] Enquiry status.
- [ ] Attachments: artwork, photos, drawings, references.
- [ ] Convert enquiry to quotation.

## 6. Quotations / Estimates
- [ ] Quote header and client details.
- [ ] Quote validity.
- [ ] Quote status: Draft, Sent, Viewed, Accepted, Rejected, Expired, Cancelled.
- [ ] Quote line items.
- [ ] Service/product, quantity, unit, rate, discount, tax, total.
- [ ] Internal expected material cost.
- [ ] Internal expected labour cost.
- [ ] Internal expected outsourcing cost.
- [ ] Internal expected expense/cost allowance.
- [ ] Expected margin.
- [ ] Terms and conditions.
- [ ] Quote PDF generation.
- [ ] Send/share quote.
- [ ] Record client approval/rejection.
- [ ] Convert accepted quote into project.
- [ ] Connect public website estimator to enquiry/quote pipeline later.

## 7. Projects
- [ ] Project number.
- [ ] Project name.
- [ ] Client.
- [ ] Source quotation/enquiry.
- [ ] Project manager/owner.
- [ ] Start date/due date.
- [ ] Contract/quoted value.
- [ ] Status: Planned, Active, On Hold, Completed, Cancelled.
- [ ] Project overview dashboard.
- [ ] Jobs tab.
- [ ] Tasks tab.
- [ ] Materials tab.
- [ ] Expenses tab.
- [ ] Purchasing tab.
- [ ] Outsourcing tab.
- [ ] Time tracking tab.
- [ ] Installations tab.
- [ ] Documents tab.
- [ ] Invoices/payments tab.
- [ ] Profitability tab.
- [ ] Activity/audit timeline.

## 8. Jobs — Core Production Model
- [ ] Job number.
- [ ] Project linkage.
- [ ] Service linkage.
- [ ] Job title/description.
- [ ] Priority.
- [ ] Start/due dates.
- [ ] Status: Draft, Ready, In Progress, Blocked, Review, Completed, Cancelled.
- [ ] Assignment type: Internal, Outsourced, Mixed.
- [ ] Revenue/value allocated to job.
- [ ] Estimated material cost.
- [ ] Estimated labour cost.
- [ ] Estimated outsourcing cost.
- [ ] Estimated other/direct expense.
- [ ] Actual material cost.
- [ ] Actual labour cost.
- [ ] Actual outsourcing cost.
- [ ] Actual other/direct expense.
- [ ] Gross profit and margin.
- [ ] Job attachments.
- [ ] Job activity history.
- [ ] Job completion approval.

## 9. Job Tasks / Work Breakdown
- [ ] Create tasks under jobs.
- [ ] Task title/description.
- [ ] Employee assignment.
- [ ] Priority.
- [ ] Start/due date.
- [ ] Estimated hours.
- [ ] Actual hours.
- [ ] Dependency/blocked-by relationships.
- [ ] Checklist/subtasks.
- [ ] Status tracking.
- [ ] Notes and attachments.
- [ ] Task completion timestamp.
- [ ] Employee workload view.

## 10. Employees / Team
- [ ] Employee master.
- [ ] Employee code.
- [ ] Contact information.
- [ ] Role.
- [ ] Department/team.
- [ ] Employment type.
- [ ] Join date.
- [ ] Active/inactive status.
- [ ] Skills/capabilities.
- [ ] Internal cost rate: hourly/daily.
- [ ] Employee project/job assignments.
- [ ] Employee workload.
- [ ] Time history.

## 11. Time Tracking / Labour Cost
- [ ] Time entry against employee + project + job + task.
- [ ] Date/start/end/hours.
- [ ] Billable/non-billable flag where needed.
- [ ] Notes.
- [ ] Approve/edit/reject time entries.
- [ ] Calculate actual labour cost from internal cost rate.
- [ ] Timesheet summary by employee/job/project.
- [ ] Planned vs actual hours.

## 12. Vendors / Outsourcing
- [ ] Vendor/supplier master.
- [ ] Company/contact information.
- [ ] Vendor type/category.
- [ ] Services/capabilities.
- [ ] Payment terms.
- [ ] Bank/payment details.
- [ ] Vendor status.
- [ ] Vendor documents.
- [ ] Vendor performance notes.

## 13. Outsourced Work
- [ ] Outsource request linked to job.
- [ ] Vendor selection.
- [ ] Scope of work.
- [ ] Requested quantity/specification.
- [ ] Due date.
- [ ] Quoted/agreed vendor cost.
- [ ] Purchase/subcontract reference.
- [ ] Outsourcing status: Requested, Approved, Sent, In Progress, Received, Rejected, Cancelled.
- [ ] Vendor deliverables/attachments.
- [ ] Vendor invoice linkage.
- [ ] Actual outsourcing cost pushed back into job/project profitability.

## 14. Materials Master
- [ ] Material code/SKU.
- [ ] Material name.
- [ ] Category.
- [ ] Unit of measure.
- [ ] Standard cost.
- [ ] Optional default selling price.
- [ ] Preferred supplier.
- [ ] Reorder level.
- [ ] Minimum stock.
- [ ] Active/inactive.
- [ ] Notes/specifications.

## 15. Warehouses / Inventory
- [ ] Warehouse/location master.
- [ ] Stock by location.
- [ ] Stock on hand.
- [ ] Reserved quantity.
- [ ] Available quantity.
- [ ] Reorder alerts.
- [ ] Material stock ledger.
- [ ] Inventory valuation basis/configuration.

## 16. Material Reservations / Job Consumption
- [ ] Material requirements per job.
- [ ] Required quantity.
- [ ] Reserved quantity.
- [ ] Issued quantity.
- [ ] Consumed quantity.
- [ ] Returned quantity.
- [ ] Wasted quantity.
- [ ] Link every issue/return/waste to project/job where applicable.
- [ ] Calculate actual material cost.

## 17. Stock Movements
- [ ] Purchase receipt.
- [ ] Stock issue.
- [ ] Return to store.
- [ ] Warehouse transfer.
- [ ] Adjustment.
- [ ] Waste/scrap.
- [ ] Stock movement reference.
- [ ] User/date/source document.
- [ ] Immutable stock ledger/history.

## 18. Purchasing
- [ ] Purchase request.
- [ ] Purchase request approval.
- [ ] Purchase order.
- [ ] PO line items.
- [ ] Supplier/vendor.
- [ ] Expected delivery.
- [ ] Goods receipt.
- [ ] Partial receipt support.
- [ ] Purchase price/history.
- [ ] Link receipts into inventory.
- [ ] Supplier bill/invoice linkage.
- [ ] Purchase status workflow.

## 19. Project / Job Expenses
- [ ] Expense record.
- [ ] Expense category.
- [ ] Project linkage.
- [ ] Job linkage where applicable.
- [ ] Employee linkage where applicable.
- [ ] Vendor/supplier linkage where applicable.
- [ ] Date.
- [ ] Amount.
- [ ] Payment method.
- [ ] Receipt attachment.
- [ ] Approval workflow.
- [ ] Direct vs general expense classification.
- [ ] Push approved direct expenses into job/project profitability.

## 20. General Business Expenses
- [ ] Office rent.
- [ ] Utilities.
- [ ] Software/subscriptions.
- [ ] Communications.
- [ ] Office supplies.
- [ ] Marketing.
- [ ] Other operating expenses.
- [ ] Expense approval.
- [ ] Monthly/annual reporting.

## 21. Installation / Field Operations
- [ ] Installation order/job.
- [ ] Project/job linkage.
- [ ] Site address.
- [ ] Site contact.
- [ ] Scheduled date/time.
- [ ] Assigned team.
- [ ] Vehicle/transport assignment.
- [ ] Installation requirements.
- [ ] Status: Scheduled, Confirmed, En Route, On Site, Completed, Rescheduled, Cancelled.
- [ ] Before/after photos.
- [ ] Site notes.
- [ ] Client confirmation.
- [ ] Completion proof.

## 22. Vehicles / Transport (Phase 2)
- [ ] Vehicle master.
- [ ] Registration/type/capacity.
- [ ] Driver/team assignment.
- [ ] Trip record.
- [ ] Project/job linkage.
- [ ] Mileage.
- [ ] Fuel cost.
- [ ] Vehicle expenses.
- [ ] Maintenance reminders.

## 23. Invoices
- [ ] Invoice number.
- [ ] Client.
- [ ] Project.
- [ ] Invoice date.
- [ ] Due date.
- [ ] Invoice lines.
- [ ] Discounts/tax.
- [ ] Total.
- [ ] Amount paid.
- [ ] Balance.
- [ ] Status: Draft, Issued, Partially Paid, Paid, Overdue, Cancelled.
- [ ] PDF generation.
- [ ] Invoice history.

## 24. Payments / Receivables
- [ ] Payment entry.
- [ ] Invoice linkage.
- [ ] Amount/date/method/reference.
- [ ] Partial payments.
- [ ] Payment allocation.
- [ ] Outstanding balance.
- [ ] Overdue calculation.
- [ ] Receivables dashboard.

## 25. Profitability / Costing Engine
- [ ] Job revenue.
- [ ] Job material cost.
- [ ] Job labour cost.
- [ ] Job outsourcing cost.
- [ ] Job direct expense.
- [ ] Job gross profit.
- [ ] Job margin percentage.
- [ ] Project revenue.
- [ ] Project total cost.
- [ ] Project gross profit/margin.
- [ ] Estimate vs actual comparison.
- [ ] Budget/forecast vs actual.
- [ ] Cost variance alerts.

## 26. Documents / Files
- [ ] Generic attachment model.
- [ ] Client documents.
- [ ] Enquiry attachments.
- [ ] Quote attachments.
- [ ] Project files.
- [ ] Job artwork/specifications.
- [ ] Purchase documents.
- [ ] Expense receipts.
- [ ] Vendor documents.
- [ ] Invoice documents.
- [ ] Installation proof.
- [ ] Secure file access rules.

## 27. Dashboard / Command Center
- [ ] Active projects.
- [ ] Jobs in production.
- [ ] Jobs due today.
- [ ] Overdue jobs.
- [ ] Pending quotes.
- [ ] Quote conversion rate.
- [ ] Outstanding invoices.
- [ ] Revenue this month.
- [ ] Expenses this month.
- [ ] Gross profit estimate/actual.
- [ ] Low stock alerts.
- [ ] Pending purchases.
- [ ] Outsourced jobs.
- [ ] Employee workload.
- [ ] Upcoming installations.
- [ ] Recent activity.

## 28. Reports
- [ ] Sales by month.
- [ ] Quotes won/lost.
- [ ] Revenue by client.
- [ ] Revenue by service.
- [ ] Project profitability.
- [ ] Job profitability.
- [ ] Material consumption.
- [ ] Material purchase history.
- [ ] Stock valuation.
- [ ] Stock movement report.
- [ ] Employee hours/cost.
- [ ] Outsourcing spend.
- [ ] Expense report.
- [ ] Invoice aging.
- [ ] Receivables.
- [ ] Installation report.
- [ ] Management summary export.

## 29. Users / Roles / Permissions
- [ ] Users.
- [ ] Roles.
- [ ] Permissions.
- [ ] Role-based page access.
- [ ] Role-based action access.
- [ ] Record-level restrictions where required.
- [ ] Active/inactive users.
- [ ] Password/session security.

## 30. Notifications / Reminders
- [ ] Job assignment notification.
- [ ] Task due reminder.
- [ ] Overdue job alert.
- [ ] Low stock alert.
- [ ] Purchase delivery reminder.
- [ ] Installation reminder.
- [ ] Quote follow-up reminder.
- [ ] Invoice overdue reminder.
- [ ] Approval notification.
- [ ] In-app notification center.
- [ ] Email/WhatsApp notifications in later phase.

## 31. Activity / Audit Log
- [ ] Login/logout events.
- [ ] Create/update/delete history.
- [ ] Status changes.
- [ ] Financial changes.
- [ ] Stock changes.
- [ ] Permission changes.
- [ ] User/date/time/reference.
- [ ] Search/filter audit history.

## 32. Public Website Integration
- [ ] Public contact form → backend lead/enquiry.
- [ ] Public quote estimator → enquiry/quote draft.
- [ ] Capture UTM/source data where available.
- [ ] Spam/rate limiting.
- [ ] Admin notification of new website enquiry.
- [ ] Optional client upload support.

## 33. Admin UX / Quality
- [ ] Responsive desktop/tablet admin layout.
- [ ] Mobile-friendly critical workflows.
- [ ] Tables with search/filter/sort/pagination.
- [ ] Form validation and useful error messages.
- [ ] Confirmation before destructive actions.
- [ ] Empty states.
- [ ] Loading/skeleton states.
- [ ] Toast/status feedback.
- [ ] Keyboard-friendly forms.
- [ ] Accessible labels and controls.

## 34. Backend API Work
- [ ] REST API conventions.
- [ ] DTO/schema validation.
- [ ] Pagination/filtering/sorting.
- [ ] Consistent error responses.
- [ ] Authentication middleware.
- [ ] Authorization middleware.
- [ ] Transaction handling for financial and stock operations.
- [ ] Idempotency for sensitive writes where needed.
- [ ] Logging/monitoring.
- [ ] API documentation.

## 35. Database / Data Integrity
- [ ] Normalized relational schema.
- [ ] Foreign keys.
- [ ] Unique constraints.
- [ ] Decimal-safe money fields.
- [ ] Time/date conventions.
- [ ] Soft-delete/archive strategy where appropriate.
- [ ] Transaction-safe stock updates.
- [ ] Transaction-safe invoice/payment updates.
- [ ] Migration/versioning process.
- [ ] Seed/demo data.
- [ ] Backup/restore plan.

## 36. Testing / Release
- [ ] Unit tests for costing calculations.
- [ ] Unit tests for stock movement calculations.
- [ ] API integration tests.
- [ ] Auth/permission tests.
- [ ] Admin critical-flow tests.
- [ ] Production build checks.
- [ ] Database migration checks.
- [ ] Error logging verification.
- [ ] Staging deployment.
- [ ] Production deployment.

## 37. Suggested Delivery Order
### Phase 1 — Foundation
- [ ] Monorepo structure: frontend/admin/backend.
- [ ] Backend + MySQL + ORM.
- [ ] Auth + roles.
- [ ] Admin shell.

### Phase 2 — Sales to Project
- [ ] Clients.
- [ ] Leads.
- [ ] Enquiries.
- [ ] Quotes.
- [ ] Projects.

### Phase 3 — Production Operations
- [ ] Jobs.
- [ ] Tasks.
- [ ] Employees.
- [ ] Time tracking.
- [ ] Vendors.
- [ ] Outsourcing.

### Phase 4 — Materials & Costs
- [ ] Materials.
- [ ] Warehouses/inventory.
- [ ] Reservations/issues/returns/waste.
- [ ] Purchasing.
- [ ] Expenses.
- [ ] Costing/profitability.

### Phase 5 — Finance & Field
- [ ] Installations.
- [ ] Invoices.
- [ ] Payments.
- [ ] Receivables.
- [ ] Reports.

### Phase 6 — Website Integration & Automation
- [ ] Website leads.
- [ ] Website estimator.
- [ ] Notifications.
- [ ] Dashboard automation.
- [ ] Client-facing automation.

## Core Business Rule
Every production cost should be traceable whenever possible through:

`Client → Project → Job → Cost`

where cost can be:

`Material + Labour + Outsourcing + Direct Expense`

This rule is the basis for reliable project/job profitability reporting.
