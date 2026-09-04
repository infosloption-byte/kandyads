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
- [x] Email/WhatsApp integrations later.

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

## UI / UX Enhancement
This workstream tracks the cross-application Admin UI/UX consistency pass. Every implementation step must update this section and be committed to `main` before moving to the next fix.

### Design-system consistency
- [ ] Establish one shared visual language for page headers, panels, buttons, form controls, tables, badges, focus states and responsive spacing.
- [x] Replace native/default browser scrollbars in Admin with a consistent modern scrollbar treatment across page, sidebar, tables, lists and modal overflow areas.
- [x] Standardize text fields, selects, textareas, search fields and other controls for height, radius, typography, borders and focus states.
- [ ] Standardize primary, secondary, icon and destructive button behavior, sizing and states.
- [ ] Standardize table Action controls so every action shows its matching icon **and** text label; icon-only controls remain reserved for compact/global controls where appropriate.
- [x] Standardize page/toolbars, responsive wrapping, alignment and spacing across all Admin views.
- [ ] Audit and remove unnecessary page-specific visual overrides where shared styles should apply.

### View-by-view consistency audit
- [x] Approvals
- [x] Clients
- [ ] Dashboard / Reports
- [x] Employees
- [ ] Enquiries
- [ ] Expenses
- [x] Installations
- [x] Inventory
- [x] Invoices
- [ ] Jobs
- [x] Leads
- [x] Materials
- [ ] Notifications
- [ ] Outsourcing
- [ ] Profitability
- [x] Projects
- [ ] Purchasing
- [x] Quotes
- [ ] Settings
- [x] Tasks
- [ ] Time Tracking
- [ ] Vendors
- [ ] Authentication and shared components

### Validation
- [ ] Run Admin production build after each UI/UX implementation batch.
- [ ] Recheck responsive behavior at desktop, tablet and mobile widths.
- [ ] Recheck keyboard focus, disabled/loading states and accessible labels after shared-control changes.
- [ ] Re-audit all Admin views after the final consistency pass.

## Recent implementation notes
- 2026-09-04: Aligned the Approvals page header with the shared `page-head-actions` layout primitive while preserving its icon+label Refresh control.
- 2026-09-04: Aligned the Tasks page header and search table toolbar with shared page-action and toolbar primitives; the compact icon-only refresh remains an appropriate utility control.
- 2026-09-04: Aligned the Projects page header and search/table toolbar with shared page-action and toolbar primitives while preserving the compact refresh utility.
- 2026-09-04: Aligned Quotes with the shared Admin UI system. The page header now uses the shared `page-head-actions` wrapper, and the quote search/refresh/count row now uses the shared `toolbar` layout while retaining the compact icon-only refresh control as an appropriate global utility action.
- 2026-09-04: Restored the Inventory Reorder alerts summary card that was accidentally omitted during the shared layout migration; the existing five-metric inventory summary is preserved.
- 2026-09-04: Aligned the Materials page header action with the shared `page-head-actions` layout primitive so single and multiple header actions use the same responsive alignment behavior.
- 2026-09-04: Aligned Inventory with the shared Admin UI system. Inventory summary cards now use the shared stat-grid/stat treatment, stock/reorder/ledger sections use shared panel/table structure, ledger filters use shared toolbar-select controls, and pagination/actions use shared button-group/page-action primitives instead of page-specific filter/pagination styling.
- 2026-09-04: Standardized the Installations table completion action. The icon-only completion control is now an explicit Actions-column button with a matching CheckCircle2 icon and visible Complete label, using the shared table-action/table-actions conventions and removing the page-specific margin override.
- 2026-09-04: Reworked `InvoicesPage.jsx` into an explicit, multiline JSX structure after a local Vite/OXC parser failure reported unclosed select/Field/div tags. The invoice form, payment form and Actions cell now have clearly paired JSX elements and readable conditional rendering, reducing parser fragility while preserving behavior.
- 2026-09-04: Aligned Leads table actions with the shared icon+label treatment and shared table-actions layout; View, Edit and Convert now follow the same spacing and sizing convention.
- 2026-09-04: Added shared Admin button and toolbar conventions. Secondary controls now align icon/text content consistently, support hover/disabled states, toolbar selects share sizing/focus treatment, page action groups wrap responsively, and approval/destructive/table-action groups have shared layout primitives.
- 2026-09-04: Standardized the Invoices table actions: PDF and Record payment now use the shared icon+label table-action treatment and the column is explicitly named Actions.
- 2026-09-04: Standardized the Employees table action to the shared icon+label convention and replaced inline page-header layout styling with the shared page-head-actions utility.
- 2026-09-04: Standardized the Clients table action to the shared icon+label convention: Edit now includes the Edit3 icon and visible text label, with an explicit Actions column.
- 2026-09-04: Added shared Admin form-control normalization. Entity-form inputs/selects/textareas now share predictable sizing, placeholder/disabled/error states, focus treatment and action-button sizing while preserving the existing component API.
- 2026-09-04: Added the first Admin UI/UX foundation fix. Admin now applies a consistent modern thin scrollbar treatment to page and nested scroll surfaces, including sidebar, tables, notification lists and modal overflow, with dark-sidebar variants and contained overscroll behavior. Shared table-action and toolbar utility classes were also introduced for the upcoming consistency pass.
- 2026-09-04: Started the Admin UI/UX Enhancement workstream. The initial audit found inconsistent table actions (text-only versus icon-only), native scrollbars on multiple overflow containers, uneven form-control/button styling, and page-specific spacing/layout patterns. The first implementation batch will establish shared scrollbar, control and layout conventions before the view-by-view cleanup.
