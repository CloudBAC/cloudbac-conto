# Invoicing Feature Design

**Date**: 2026-03-08
**Status**: Approved
**Approach**: Separate collections (Invoices + InvoicePayments join table)

## Summary

Add outgoing (sales) invoicing to the platform. Orgs create invoices for parties with line items, taxes, and payment terms. Invoices link to transactions via a many-to-many join table with FIFO auto-allocation. PDFs generated client-side (mobile + admin).

## Data Model

### Invoices Collection

| Field | Type | Details |
|---|---|---|
| `invoiceNumber` | text | Auto-generated: `{orgPrefix}-{sequential}` (e.g., "ABC-0001"). Read-only after create. |
| `type` | select | `sales` only for now. Extensible to `purchase` later. |
| `status` | select | `draft`, `sent`, `partially_paid`, `paid`, `overdue`, `cancelled` |
| `party` | relationship -> Parties | Client this invoice is for. Required. |
| `organization` | relationship -> Organizations | Tenant scoping. Auto-populated. |
| `project` | relationship -> Projects | Optional project association. |
| `issueDate` | date | When issued. |
| `dueDate` | date | Payment deadline. |
| `paymentTerms` | select | `immediate`, `net_15`, `net_30`, `net_60`, `custom` |
| `lineItems` | array | See below. |
| `subtotal` | number | Auto-computed from line items. |
| `taxes` | array of `{taxType: rel->Taxes, taxAmount: number}` | Aggregated from line items. Auto-computed. |
| `totalAmount` | number | subtotal + sum of tax amounts. |
| `paidAmount` | number | Auto-computed from InvoicePayments. Read-only. |
| `balanceDue` | number | totalAmount - paidAmount. Read-only. |
| `notes` | textarea | Optional notes/terms shown on invoice. |
| `createdBy` | relationship -> Users | Auto-populated. |

### Line Items (array field on Invoice)

| Field | Type | Details |
|---|---|---|
| `description` | text | Item/service description. Required. |
| `quantity` | number | Default 1. Min 0.01. |
| `rate` | number | Price per unit. Min 0. |
| `amount` | number | Auto-computed: quantity x rate. |
| `taxType` | relationship -> Taxes | Optional tax for this line item. |

### InvoicePayments Collection (Join Table)

| Field | Type | Details |
|---|---|---|
| `invoice` | relationship -> Invoices | Required. |
| `transaction` | relationship -> Transactions | Required. |
| `allocatedAmount` | number | How much of the transaction applies to this invoice. Required. Min 0.01. |
| `organization` | relationship -> Organizations | Tenant scoping. Auto-populated. |
| `createdBy` | relationship -> Users | Auto-populated. |

### Organization Fields (additions)

| Field | Type | Details |
|---|---|---|
| `invoicePrefix` | text | Custom prefix for invoice numbers (e.g., "ABC"). |
| `invoiceNextNumber` | number | Next sequential number. Auto-incremented on invoice creation. Default 1. |

## Business Logic

### Invoice Number Generation

`beforeChange` hook on Invoices (create only):
1. Read org's `invoicePrefix` + `invoiceNextNumber`
2. Generate `{prefix}-{paddedNumber}` (zero-padded to 4 digits)
3. Increment org's `invoiceNextNumber` atomically via `req` transaction context

### Auto-Compute Totals

`beforeChange` hook on Invoices:
1. Compute each line item `amount` = quantity x rate
2. Compute `subtotal` = sum of line item amounts
3. Aggregate taxes by type from line items, compute tax amounts (rate x line item amount)
4. Compute `totalAmount` = subtotal + sum of tax amounts

### FIFO Auto-Allocation

Custom endpoint `POST /api/invoices/auto-allocate`:
- Input: `transactionId`
- Finds all unpaid/partially-paid invoices for the transaction's party, ordered by `dueDate` ASC
- Creates InvoicePayment records, allocating the transaction amount across invoices until exhausted
- Returns created allocations

### Payment Status Updates

`afterChange` hook on InvoicePayments (create/update/delete):
1. Recalculate invoice's `paidAmount` from all linked InvoicePayments
2. Update `balanceDue` = totalAmount - paidAmount
3. Update `status`:
   - paidAmount === 0 -> keep current (draft/sent)
   - 0 < paidAmount < totalAmount -> `partially_paid`
   - paidAmount >= totalAmount -> `paid`

### Overdue Detection

Lazy check on invoice list reads. When listing invoices, any with `dueDate` < today AND `balanceDue` > 0 AND status in (`sent`, `partially_paid`) get updated to `overdue`.

### Access Control

Reuses existing tenant isolation patterns:
- `tenantIsolation` for read queries
- `tenantCreate` for creation
- `tenantDelete` for deletion

## PDF Generation

Client-side approach:
- **Mobile**: `expo-print` + `expo-sharing` - renders HTML template to PDF
- **Admin panel**: `@react-pdf/renderer` - "Download PDF" button
- **Data source**: `GET /api/invoices/:id?depth=2` provides all data
- **Template content**: Org branding (name, address, GST), party details, line items table, tax breakdown, totals, payment terms, notes

## Mobile App Screens

### Navigation Changes

Add to Dashboard Stack:
- `InvoiceListScreen` - new list alongside Projects
- `InvoiceDetailScreen` - view with status, line items, payments, actions
- `InvoiceFormScreen` - create/edit with party picker, line items editor

Additions to existing screens:
- `TransactionDetailScreen` - "Linked Invoices" section
- `PartyDetailScreen` - "Invoices" tab

### InvoiceListScreen
- Filter chips by status
- Summary bar: total outstanding, total overdue
- Search by invoice number or party name
- Sort by date, amount, due date
- FAB to create new invoice

### InvoiceFormScreen
- Party picker (required), project picker (optional)
- Date pickers for issue date and due date
- Payment terms dropdown
- Line items editor: add/remove rows with description, quantity, rate, tax type
- Auto-computed subtotal, taxes, total
- Notes field
- Save as draft or save and send

### InvoiceDetailScreen
- Header: invoice number, status badge, party name
- Line items table, tax breakdown, totals
- Payment section: linked transactions with allocated amounts, paid total, balance due
- Actions: Edit (draft only), Mark as Sent, Record Payment, Download PDF, Cancel
- "Record Payment" opens TransactionFormScreen pre-filled with party and amount = balance due

### New API Layer
- `useInvoices`, `useInvoice`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`
- `useInvoicePayments` - payment allocation list
- `useAutoAllocate` - auto-allocate mutation
- Api class methods for invoices and invoice payments

## Error Handling & Edge Cases

- **Delete transaction with invoice links**: `beforeDelete` hook prevents deletion, returns error listing affected invoices
- **Delete invoice with payments**: `beforeDelete` hook prevents deletion. Must cancel instead.
- **Over-allocation**: Validation prevents allocating more than transaction amount or more than invoice balance due
- **Edit paid invoice**: Once `paid`, invoice is read-only except for cancellation
- **Invoice number uniqueness**: Unique constraint per organization
- **Concurrent counter increment**: Use `req` transaction context for atomicity
