# Invoicing Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add outgoing sales invoicing with line items, tax computation, auto-sequential numbering, many-to-many transaction linking with FIFO auto-allocation, and client-side PDF generation.

**Architecture:** Two new Payload collections (Invoices, InvoicePayments) plus invoice settings fields on Organizations. Backend hooks handle number generation, total computation, and payment status updates. A custom endpoint handles FIFO auto-allocation. Mobile app gets three new screens (list, detail, form) and a React Query hook layer. PDFs generated client-side via expo-print.

**Tech Stack:** Payload CMS 3.77, Next.js 15, Cloudflare D1 (SQLite), React Native 0.81, Expo 54, expo-print, @tanstack/react-query

**Design doc:** `docs/plans/2026-03-08-invoicing-design.md`

---

## Task 1: Invoices Collection (Backend)

**Files:**
- Create: `cloudbac-conto/src/collections/Invoices.ts`
- Modify: `cloudbac-conto/src/payload.config.ts`

**Step 1: Create the Invoices collection**

Create `src/collections/Invoices.ts`:

```typescript
import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, tenantDelete, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'
import { populateCreatedBy } from '@/hooks/populateCreatedBy'
import { computeInvoiceTotals } from '@/hooks/computeInvoiceTotals'
import { generateInvoiceNumber } from '@/hooks/generateInvoiceNumber'

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
  },
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantDelete,
  },
  hooks: {
    beforeValidate: [populateOrganization],
    beforeChange: [
      populateCreatedBy,
      generateInvoiceNumber,
      computeInvoiceTotals,
    ],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'sales',
      options: [
        { label: 'Sales', value: 'sales' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Partially Paid', value: 'partially_paid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'party',
      type: 'relationship',
      relationTo: 'parties',
      required: true,
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
      }),
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      access: {
        update: isSuperAdmin,
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
      }),
    },
    {
      name: 'issueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'paymentTerms',
      type: 'select',
      defaultValue: 'net_30',
      options: [
        { label: 'Immediate', value: 'immediate' },
        { label: 'Net 15', value: 'net_15' },
        { label: 'Net 30', value: 'net_30' },
        { label: 'Net 60', value: 'net_60' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'lineItems',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0.01,
        },
        {
          name: 'rate',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'amount',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          name: 'taxType',
          type: 'relationship',
          relationTo: 'taxes',
          filterOptions: ({ data }) => ({
            organization: { equals: data?.organization },
          }),
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'taxes',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        {
          name: 'taxType',
          type: 'relationship',
          relationTo: 'taxes',
          required: true,
        },
        {
          name: 'taxAmount',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'paidAmount',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'balanceDue',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
}
```

**Step 2: Register in payload.config.ts**

Add import and add to collections array in `src/payload.config.ts`:

```typescript
// Add import after Taxes import:
import { Invoices } from './collections/Invoices'

// Add to collections array:
collections: [Organizations, Users, Media, Projects, Parties, Categories, Transactions, Taxes, Invoices],
```

**Step 3: Run type generation**

```bash
cd cloudbac-conto && pnpm generate:types
```

**Step 4: Commit**

```bash
git add src/collections/Invoices.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Invoices collection"
```

---

## Task 2: InvoicePayments Collection (Backend)

**Files:**
- Create: `cloudbac-conto/src/collections/InvoicePayments.ts`
- Modify: `cloudbac-conto/src/payload.config.ts`

**Step 1: Create the InvoicePayments collection**

Create `src/collections/InvoicePayments.ts`:

```typescript
import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, tenantDelete, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'
import { populateCreatedBy } from '@/hooks/populateCreatedBy'
import { updateInvoicePaymentStatus } from '@/hooks/updateInvoicePaymentStatus'

export const InvoicePayments: CollectionConfig = {
  slug: 'invoice-payments',
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantDelete,
  },
  hooks: {
    beforeValidate: [populateOrganization],
    beforeChange: [populateCreatedBy],
    afterChange: [updateInvoicePaymentStatus],
    afterDelete: [updateInvoicePaymentStatus],
  },
  fields: [
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: 'invoices',
      required: true,
    },
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
    },
    {
      name: 'allocatedAmount',
      type: 'number',
      required: true,
      min: 0.01,
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      access: {
        update: isSuperAdmin,
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
}
```

**Step 2: Register in payload.config.ts**

```typescript
// Add import:
import { InvoicePayments } from './collections/InvoicePayments'

// Update collections:
collections: [Organizations, Users, Media, Projects, Parties, Categories, Transactions, Taxes, Invoices, InvoicePayments],
```

**Step 3: Run type generation**

```bash
cd cloudbac-conto && pnpm generate:types
```

**Step 4: Commit**

```bash
git add src/collections/InvoicePayments.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add InvoicePayments collection"
```

---

## Task 3: Organization Invoice Settings

**Files:**
- Modify: `cloudbac-conto/src/collections/Organizations.ts`

**Step 1: Add invoice settings fields**

Add these fields to the `fields` array in `src/collections/Organizations.ts`, after the existing `parent` field:

```typescript
{
  name: 'invoicePrefix',
  type: 'text',
  admin: {
    description: 'Custom prefix for invoice numbers (e.g., "ABC")',
  },
},
{
  name: 'invoiceNextNumber',
  type: 'number',
  defaultValue: 1,
  min: 1,
  admin: {
    description: 'Next sequential invoice number (auto-incremented)',
  },
},
```

Also add `'invoices', 'invoice-payments'` to the collections checked in the `beforeDelete` hook:

```typescript
const collections = ['projects', 'parties', 'transactions', 'media', 'invoices', 'invoice-payments'] as const
```

**Step 2: Run type generation**

```bash
cd cloudbac-conto && pnpm generate:types
```

**Step 3: Commit**

```bash
git add src/collections/Organizations.ts src/payload-types.ts
git commit -m "feat: add invoice settings to Organizations"
```

---

## Task 4: Invoice Hooks (Business Logic)

**Files:**
- Create: `cloudbac-conto/src/hooks/generateInvoiceNumber.ts`
- Create: `cloudbac-conto/src/hooks/computeInvoiceTotals.ts`
- Create: `cloudbac-conto/src/hooks/updateInvoicePaymentStatus.ts`

**Step 1: Create generateInvoiceNumber hook**

Create `src/hooks/generateInvoiceNumber.ts`:

```typescript
import type { CollectionBeforeChangeHook } from 'payload'

export const generateInvoiceNumber: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const orgId = data.organization
  if (!orgId) return data

  const org = await req.payload.findByID({
    collection: 'organizations',
    id: orgId,
    depth: 0,
    req,
  })

  const prefix = org.invoicePrefix || 'INV'
  const nextNum = org.invoiceNextNumber || 1
  const padded = String(nextNum).padStart(4, '0')
  data.invoiceNumber = `${prefix}-${padded}`

  await req.payload.update({
    collection: 'organizations',
    id: orgId,
    data: { invoiceNextNumber: nextNum + 1 },
    req,
  })

  return data
}
```

**Step 2: Create computeInvoiceTotals hook**

Create `src/hooks/computeInvoiceTotals.ts`:

```typescript
import type { CollectionBeforeChangeHook } from 'payload'

export const computeInvoiceTotals: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!data.lineItems || !Array.isArray(data.lineItems)) return data

  const taxRateCache = new Map<string, number>()

  const getTaxRate = async (taxTypeId: string): Promise<number> => {
    if (taxRateCache.has(taxTypeId)) return taxRateCache.get(taxTypeId)!
    const tax = await req.payload.findByID({
      collection: 'taxes',
      id: taxTypeId,
      depth: 0,
      req,
    })
    taxRateCache.set(taxTypeId, tax.rate)
    return tax.rate
  }

  let subtotal = 0
  const taxAggregation = new Map<string, number>()

  for (const item of data.lineItems) {
    const quantity = item.quantity || 1
    const rate = item.rate || 0
    const lineAmount = quantity * rate
    item.amount = Math.round(lineAmount * 100) / 100
    subtotal += item.amount

    if (item.taxType) {
      const taxId = typeof item.taxType === 'object' ? item.taxType.id : item.taxType
      const taxRate = await getTaxRate(taxId)
      const taxAmount = (item.amount * taxRate) / 100
      const rounded = Math.round(taxAmount * 100) / 100
      taxAggregation.set(taxId, (taxAggregation.get(taxId) || 0) + rounded)
    }
  }

  data.subtotal = Math.round(subtotal * 100) / 100

  const taxes: { taxType: string; taxAmount: number }[] = []
  let totalTax = 0
  for (const [taxId, amount] of taxAggregation.entries()) {
    taxes.push({ taxType: taxId, taxAmount: amount })
    totalTax += amount
  }
  data.taxes = taxes

  data.totalAmount = Math.round((data.subtotal + totalTax) * 100) / 100
  data.balanceDue = Math.round((data.totalAmount - (data.paidAmount || 0)) * 100) / 100

  return data
}
```

**Step 3: Create updateInvoicePaymentStatus hook**

Create `src/hooks/updateInvoicePaymentStatus.ts`:

```typescript
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const updateInvoicePaymentStatus: CollectionAfterChangeHook &
  CollectionAfterDeleteHook = async ({ doc, req, previousDoc }) => {
  const invoiceId = doc?.invoice || previousDoc?.invoice
  if (!invoiceId) return doc

  const resolvedId = typeof invoiceId === 'object' ? invoiceId.id : invoiceId

  const payments = await req.payload.find({
    collection: 'invoice-payments',
    where: { invoice: { equals: resolvedId } },
    depth: 0,
    pagination: false,
    req,
  })

  const paidAmount = payments.docs.reduce(
    (sum, p) => sum + (p.allocatedAmount || 0),
    0,
  )
  const roundedPaid = Math.round(paidAmount * 100) / 100

  const invoice = await req.payload.findByID({
    collection: 'invoices',
    id: resolvedId,
    depth: 0,
    req,
  })

  let newStatus = invoice.status
  if (roundedPaid <= 0) {
    // Keep current status (draft/sent)
  } else if (roundedPaid < invoice.totalAmount) {
    newStatus = 'partially_paid'
  } else {
    newStatus = 'paid'
  }

  await req.payload.update({
    collection: 'invoices',
    id: resolvedId,
    data: {
      paidAmount: roundedPaid,
      balanceDue: Math.round((invoice.totalAmount - roundedPaid) * 100) / 100,
      status: newStatus,
    },
    req,
  })

  return doc
}
```

**Step 4: Commit**

```bash
git add src/hooks/generateInvoiceNumber.ts src/hooks/computeInvoiceTotals.ts src/hooks/updateInvoicePaymentStatus.ts
git commit -m "feat: add invoice business logic hooks"
```

---

## Task 5: Auto-Allocate Endpoint

**Files:**
- Create: `cloudbac-conto/src/app/api/invoices/auto-allocate/route.ts`

**Step 1: Create the auto-allocate endpoint**

Create `src/app/api/invoices/auto-allocate/route.ts`:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

  const user = request.headers.get('Authorization')
    ? await payload
        .find({
          collection: 'users',
          where: {},
          limit: 0,
          overrideAccess: false,
          user: undefined,
        })
        .catch(() => null)
    : null

  // Parse auth from Payload's built-in JWT
  let authenticatedUser: any = null
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('JWT ')) {
    const token = authHeader.slice(4)
    try {
      const result = await payload.verifyJWT({ token, collection: 'users' })
      if (result) {
        authenticatedUser = await payload.findByID({
          collection: 'users',
          id: result.id as string,
          depth: 0,
        })
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!authenticatedUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { transactionId } = body

  if (!transactionId) {
    return NextResponse.json(
      { error: 'transactionId is required' },
      { status: 400 },
    )
  }

  const transaction = await payload.findByID({
    collection: 'transactions',
    id: transactionId,
    depth: 1,
  })

  if (!transaction) {
    return NextResponse.json(
      { error: 'Transaction not found' },
      { status: 404 },
    )
  }

  // Determine party ID from transaction (the party receiving the payment)
  const toPartyValue = transaction.toParty?.value
  const partyId =
    typeof toPartyValue === 'object' ? toPartyValue?.id : toPartyValue

  if (!partyId) {
    return NextResponse.json(
      { error: 'Transaction has no target party' },
      { status: 400 },
    )
  }

  // Find how much of this transaction is already allocated
  const existingAllocations = await payload.find({
    collection: 'invoice-payments',
    where: { transaction: { equals: transactionId } },
    depth: 0,
    pagination: false,
  })

  const alreadyAllocated = existingAllocations.docs.reduce(
    (sum, p) => sum + (p.allocatedAmount || 0),
    0,
  )
  let remaining = Math.round((transaction.amount - alreadyAllocated) * 100) / 100

  if (remaining <= 0) {
    return NextResponse.json({
      message: 'Transaction fully allocated',
      allocations: [],
    })
  }

  // Find unpaid/partially-paid invoices for this party, oldest due date first
  const invoices = await payload.find({
    collection: 'invoices',
    where: {
      party: { equals: partyId },
      status: { in: ['sent', 'partially_paid', 'overdue'] },
      balanceDue: { greater_than: 0 },
    },
    sort: 'dueDate',
    depth: 0,
    pagination: false,
  })

  const createdAllocations = []

  for (const invoice of invoices.docs) {
    if (remaining <= 0) break

    const allocateAmount = Math.min(remaining, invoice.balanceDue)

    const allocation = await payload.create({
      collection: 'invoice-payments',
      data: {
        invoice: invoice.id,
        transaction: transactionId,
        allocatedAmount: Math.round(allocateAmount * 100) / 100,
        organization: transaction.organization as string,
      },
      user: authenticatedUser,
    })

    createdAllocations.push(allocation)
    remaining = Math.round((remaining - allocateAmount) * 100) / 100
  }

  return NextResponse.json({
    message: `Allocated to ${createdAllocations.length} invoice(s)`,
    remaining,
    allocations: createdAllocations,
  })
}
```

**Step 2: Commit**

```bash
git add src/app/api/invoices/auto-allocate/route.ts
git commit -m "feat: add FIFO auto-allocate endpoint"
```

---

## Task 6: Transaction Delete Guard

**Files:**
- Modify: `cloudbac-conto/src/collections/Transactions.ts`

**Step 1: Add beforeDelete hook to prevent deleting linked transactions**

Add a `beforeDelete` hook to Transactions. Update `src/collections/Transactions.ts`:

```typescript
// Add to the hooks object (after the existing beforeValidate):
beforeDelete: [
  async ({ id, req }) => {
    const linkedPayments = await req.payload.find({
      collection: 'invoice-payments',
      where: { transaction: { equals: id } },
      depth: 0,
      limit: 1,
    })
    if (linkedPayments.totalDocs > 0) {
      throw new Error(
        'Cannot delete a transaction linked to invoices. Unlink the invoice payments first.',
      )
    }
  },
],
```

**Step 2: Add beforeDelete hook to Invoices for payment guard**

Add to `src/collections/Invoices.ts` hooks:

```typescript
// Add to hooks object:
beforeDelete: [
  async ({ id, req }) => {
    const linkedPayments = await req.payload.find({
      collection: 'invoice-payments',
      where: { invoice: { equals: id } },
      depth: 0,
      limit: 1,
    })
    if (linkedPayments.totalDocs > 0) {
      throw new Error(
        'Cannot delete an invoice with linked payments. Cancel the invoice instead.',
      )
    }
  },
],
```

**Step 3: Commit**

```bash
git add src/collections/Transactions.ts src/collections/Invoices.ts
git commit -m "feat: add delete guards for invoice-linked records"
```

---

## Task 7: Database Migration

**Files:**
- New migration file in `cloudbac-conto/src/migrations/`

**Step 1: Create the migration**

```bash
cd cloudbac-conto && pnpm payload migrate:create
```

This generates a migration for the new Invoices, InvoicePayments tables and the new Organizations fields.

**Step 2: Verify the migration looks correct**

Open the generated migration file and check it creates:
- `invoices` table with all fields
- `invoices_line_items` array table
- `invoices_taxes` array table
- `invoice_payments` table
- `invoicePrefix` and `invoiceNextNumber` columns on `organizations`

**Step 3: Commit**

```bash
git add src/migrations/
git commit -m "feat: add invoicing database migration"
```

---

## Task 8: Integration Tests

**Files:**
- Create: `cloudbac-conto/tests/int/invoices.int.spec.ts`

**Step 1: Write integration tests**

Create `tests/int/invoices.int.spec.ts`:

```typescript
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, beforeEach, expect } from 'vitest'

let payload: Payload
let testOrg: any
let testParty: any
let testTax: any

describe('Invoices', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Seed test org
    testOrg = await payload.create({
      collection: 'organizations',
      data: { name: 'Test Org', invoicePrefix: 'TST', invoiceNextNumber: 1 },
    })

    // Seed test party
    testParty = await payload.create({
      collection: 'parties',
      data: { name: 'Test Client', type: 'company', organization: testOrg.id },
    })

    // Seed test tax
    testTax = await payload.create({
      collection: 'taxes',
      data: { name: 'GST', rate: 18, organization: testOrg.id },
    })
  })

  it('creates an invoice with auto-generated number', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      data: {
        type: 'sales',
        status: 'draft',
        party: testParty.id,
        organization: testOrg.id,
        issueDate: '2026-03-08',
        dueDate: '2026-04-07',
        paymentTerms: 'net_30',
        lineItems: [
          { description: 'Consulting', quantity: 10, rate: 1000 },
        ],
      },
    })

    expect(invoice.invoiceNumber).toBe('TST-0001')
    expect(invoice.subtotal).toBe(10000)
    expect(invoice.totalAmount).toBe(10000)
    expect(invoice.balanceDue).toBe(10000)
    expect(invoice.paidAmount).toBe(0)
  })

  it('computes taxes from line items', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      data: {
        type: 'sales',
        status: 'draft',
        party: testParty.id,
        organization: testOrg.id,
        issueDate: '2026-03-08',
        dueDate: '2026-04-07',
        lineItems: [
          { description: 'Dev Work', quantity: 5, rate: 2000, taxType: testTax.id },
        ],
      },
    })

    expect(invoice.subtotal).toBe(10000)
    expect(invoice.taxes).toHaveLength(1)
    expect(invoice.taxes[0].taxAmount).toBe(1800)
    expect(invoice.totalAmount).toBe(11800)
  })

  it('increments invoice number sequentially', async () => {
    const inv1 = await payload.create({
      collection: 'invoices',
      data: {
        type: 'sales',
        party: testParty.id,
        organization: testOrg.id,
        issueDate: '2026-03-08',
        dueDate: '2026-04-07',
        lineItems: [{ description: 'Item A', quantity: 1, rate: 100 }],
      },
    })

    const inv2 = await payload.create({
      collection: 'invoices',
      data: {
        type: 'sales',
        party: testParty.id,
        organization: testOrg.id,
        issueDate: '2026-03-08',
        dueDate: '2026-04-07',
        lineItems: [{ description: 'Item B', quantity: 1, rate: 200 }],
      },
    })

    // Numbers should be sequential (exact values depend on test order)
    expect(inv1.invoiceNumber).not.toBe(inv2.invoiceNumber)
    const num1 = parseInt(inv1.invoiceNumber.split('-')[1])
    const num2 = parseInt(inv2.invoiceNumber.split('-')[1])
    expect(num2).toBe(num1 + 1)
  })

  it('updates payment status when InvoicePayment is created', async () => {
    const invoice = await payload.create({
      collection: 'invoices',
      data: {
        type: 'sales',
        status: 'sent',
        party: testParty.id,
        organization: testOrg.id,
        issueDate: '2026-03-08',
        dueDate: '2026-04-07',
        lineItems: [{ description: 'Service', quantity: 1, rate: 5000 }],
      },
    })

    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        amount: 3000,
        date: '2026-03-10',
        organization: testOrg.id,
        fromParty: { relationTo: 'parties', value: testParty.id },
        toParty: { relationTo: 'parties', value: testParty.id },
        mainPartyFrom: null,
        mainPartyTo: null,
        transferType: 'bank',
      },
    })

    await payload.create({
      collection: 'invoice-payments',
      data: {
        invoice: invoice.id,
        transaction: transaction.id,
        allocatedAmount: 3000,
        organization: testOrg.id,
      },
    })

    const updated = await payload.findByID({
      collection: 'invoices',
      id: invoice.id,
      depth: 0,
    })

    expect(updated.paidAmount).toBe(3000)
    expect(updated.balanceDue).toBe(2000)
    expect(updated.status).toBe('partially_paid')
  })
})
```

**Step 2: Run the tests**

```bash
cd cloudbac-conto && pnpm test:int -- tests/int/invoices.int.spec.ts
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add tests/int/invoices.int.spec.ts
git commit -m "test: add invoice integration tests"
```

---

## Task 9: Mobile App - API Types & Service

**Files:**
- Modify: `Conto/app/services/api/types.ts`
- Modify: `Conto/app/services/api/index.ts`

**Step 1: Add Invoice and InvoicePayment types**

Add to `Conto/app/services/api/types.ts`:

```typescript
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled"
export type PaymentTerms = "immediate" | "net_15" | "net_30" | "net_60" | "custom"

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  rate: number
  amount?: number
  taxType?: string | Tax
}

export interface InvoiceTax {
  id?: string
  taxType: string | Tax
  taxAmount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  type: "sales"
  status: InvoiceStatus
  party: string | Party
  organization: string | Organization
  project?: string | Project | null
  issueDate: string
  dueDate: string
  paymentTerms?: PaymentTerms
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxes?: InvoiceTax[]
  totalAmount: number
  paidAmount: number
  balanceDue: number
  notes?: string
  createdBy?: string | PayloadUser
  createdAt: string
  updatedAt: string
}

export interface InvoicePayment {
  id: string
  invoice: string | Invoice
  transaction: string | Transaction
  allocatedAmount: number
  organization: string | Organization
  createdBy?: string | PayloadUser
  createdAt: string
  updatedAt: string
}

export interface AutoAllocateResponse {
  message: string
  remaining: number
  allocations: InvoicePayment[]
}
```

**Step 2: Add Invoice API methods**

Add to the `Api` class in `Conto/app/services/api/index.ts`:

```typescript
// Add Invoice and InvoicePayment to the type imports:
import type {
  // ... existing imports ...
  Invoice,
  InvoicePayment,
  AutoAllocateResponse,
} from "./types"

// Add these methods to the Api class:

// --- Invoices ---
async getInvoices(params?: PayloadQueryParams) {
  return this.getList<Invoice>("invoices", params)
}
async getInvoice(id: string, depth?: number) {
  return this.getOne<Invoice>("invoices", id, depth)
}
async createInvoice(data: Record<string, unknown>) {
  return this.createOne<Invoice>("invoices", data)
}
async updateInvoice(id: string, data: Record<string, unknown>) {
  return this.updateOne<Invoice>("invoices", id, data)
}
async deleteInvoice(id: string) {
  return this.deleteOne("invoices", id)
}

// --- Invoice Payments ---
async getInvoicePayments(params?: PayloadQueryParams) {
  return this.getList<InvoicePayment>("invoice-payments", params)
}
async createInvoicePayment(data: Record<string, unknown>) {
  return this.createOne<InvoicePayment>("invoice-payments", data)
}
async deleteInvoicePayment(id: string) {
  return this.deleteOne("invoice-payments", id)
}

// --- Auto-Allocate ---
async autoAllocate(
  transactionId: string,
): Promise<{ kind: "ok"; data: AutoAllocateResponse } | GeneralApiProblem> {
  const response: ApiResponse<AutoAllocateResponse> = await this.apisauce.post(
    "/api/invoices/auto-allocate",
    { transactionId },
  )
  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }
  return { kind: "ok", data: response.data! }
}
```

**Step 3: Commit**

```bash
cd Conto && git add app/services/api/types.ts app/services/api/index.ts
git commit -m "feat: add invoice API types and service methods"
```

---

## Task 10: Mobile App - React Query Hooks

**Files:**
- Create: `Conto/app/hooks/queries/useInvoices.ts`
- Create: `Conto/app/hooks/queries/useInvoicePayments.ts`

**Step 1: Create useInvoices hook**

Create `Conto/app/hooks/queries/useInvoices.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/services/api"
import type { PayloadQueryParams } from "@/services/api/types"

import { unwrapApiResult, unwrapApiVoid } from "./queryHelpers"

export function useInvoices(params?: PayloadQueryParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => api.getInvoices(params).then(unwrapApiResult),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.getInvoice(id, 2).then(unwrapApiResult),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.createInvoice(data).then(unwrapApiResult),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateInvoice(id, data).then(unwrapApiResult),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteInvoice(id).then(unwrapApiVoid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  })
}
```

**Step 2: Create useInvoicePayments hook**

Create `Conto/app/hooks/queries/useInvoicePayments.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/services/api"
import type { PayloadQueryParams } from "@/services/api/types"

import { unwrapApiResult, unwrapApiVoid } from "./queryHelpers"

export function useInvoicePayments(params?: PayloadQueryParams) {
  return useQuery({
    queryKey: ["invoice-payments", params],
    queryFn: () => api.getInvoicePayments(params).then(unwrapApiResult),
  })
}

export function useCreateInvoicePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.createInvoicePayment(data).then(unwrapApiResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payments"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}

export function useDeleteInvoicePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteInvoicePayment(id).then(unwrapApiVoid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payments"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}

export function useAutoAllocate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (transactionId: string) =>
      api.autoAllocate(transactionId).then(unwrapApiResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payments"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
    },
  })
}
```

**Step 3: Commit**

```bash
cd Conto && git add app/hooks/queries/useInvoices.ts app/hooks/queries/useInvoicePayments.ts
git commit -m "feat: add invoice React Query hooks"
```

---

## Task 11: Mobile App - Navigation Types & Setup

**Files:**
- Modify: `Conto/app/navigators/navigationTypes.ts`
- Modify: `Conto/app/navigators/OrgUserNavigator.tsx`

**Step 1: Add invoice screen types to navigation**

In `Conto/app/navigators/navigationTypes.ts`, add to `DashboardStackParamList`:

```typescript
export type DashboardStackParamList = {
  ProjectList: undefined
  ProjectDetail: { id: string }
  ProjectForm: { id?: string }
  TransactionDetail: { id: string }
  TransactionForm: { id?: string; projectId?: string }
  InvoiceList: undefined
  InvoiceDetail: { id: string }
  InvoiceForm: { id?: string; partyId?: string }
}
```

**Step 2: Add invoice screens to OrgUserNavigator**

In `Conto/app/navigators/OrgUserNavigator.tsx`:

Add imports:

```typescript
import { InvoiceListScreen } from "@/screens/InvoiceListScreen"
import { InvoiceDetailScreen } from "@/screens/InvoiceDetailScreen"
import { InvoiceFormScreen } from "@/screens/InvoiceFormScreen"
```

Add screens to `DashboardNavigator` function (after TransactionForm screen):

```typescript
<DashboardStack.Screen name="InvoiceList" component={InvoiceListScreen} />
<DashboardStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
<DashboardStack.Screen name="InvoiceForm" component={InvoiceFormScreen} />
```

**Step 3: Commit**

```bash
cd Conto && git add app/navigators/navigationTypes.ts app/navigators/OrgUserNavigator.tsx
git commit -m "feat: add invoice navigation screens"
```

---

## Task 12: Mobile App - InvoiceListScreen

**Files:**
- Create: `Conto/app/screens/InvoiceListScreen.tsx`

**Step 1: Create InvoiceListScreen**

Create `Conto/app/screens/InvoiceListScreen.tsx`. Follow the same pattern as `TransactionListScreen.tsx`:

- Filter chips by status: All, Draft, Sent, Partially Paid, Paid, Overdue
- Summary bar showing total outstanding and total overdue amounts
- FlatList rendering invoice cards with: invoice number, party name, total amount, status badge, due date
- FAB button to navigate to InvoiceFormScreen
- Pull-to-refresh
- Search by invoice number or party name
- Navigate to InvoiceDetailScreen on card press

Use the same component imports (`Screen`, `Header`, `Card`, `Text`, `EmptyState`, `Icon`) and theming patterns from TransactionListScreen.

The screen component should be typed as `FC<DashboardStackScreenProps<"InvoiceList">>`.

**Step 2: Commit**

```bash
cd Conto && git add app/screens/InvoiceListScreen.tsx
git commit -m "feat: add InvoiceListScreen"
```

---

## Task 13: Mobile App - InvoiceFormScreen

**Files:**
- Create: `Conto/app/screens/InvoiceFormScreen.tsx`

**Step 1: Create InvoiceFormScreen**

Create `Conto/app/screens/InvoiceFormScreen.tsx`:

- If `route.params.id` exists, load existing invoice for editing
- Party picker (relationship picker similar to TransactionFormScreen's party picker)
- Project picker (optional)
- Issue date and due date pickers
- Payment terms dropdown
- Line items editor: dynamic list with add/remove buttons, each row has description (text), quantity (number), rate (number), tax type (picker). Show computed amount per line.
- Auto-computed subtotal, tax breakdown, and total at the bottom
- Notes textarea
- Save button: creates or updates invoice via `useCreateInvoice` / `useUpdateInvoice`
- On success, navigate back

The screen component should be typed as `FC<DashboardStackScreenProps<"InvoiceForm">>`.

**Step 2: Commit**

```bash
cd Conto && git add app/screens/InvoiceFormScreen.tsx
git commit -m "feat: add InvoiceFormScreen"
```

---

## Task 14: Mobile App - InvoiceDetailScreen

**Files:**
- Create: `Conto/app/screens/InvoiceDetailScreen.tsx`

**Step 1: Create InvoiceDetailScreen**

Create `Conto/app/screens/InvoiceDetailScreen.tsx`:

- Header with invoice number and status badge (colored by status)
- Party name, issue date, due date, payment terms
- Line items table: description, qty, rate, amount columns
- Tax breakdown section
- Totals: subtotal, taxes, total, paid, balance due
- Payments section: query `invoice-payments` for this invoice, show each linked transaction with amount
- Action buttons:
  - Edit (if status === 'draft') → navigate to InvoiceFormScreen with id
  - Mark as Sent (if draft) → update status to 'sent'
  - Record Payment → navigate to TransactionFormScreen pre-filled with party and amount = balanceDue
  - Download PDF → generate and share PDF (Task 15)
  - Cancel (if not paid) → update status to 'cancelled'
- Notes section

The screen component should be typed as `FC<DashboardStackScreenProps<"InvoiceDetail">>`.

**Step 2: Commit**

```bash
cd Conto && git add app/screens/InvoiceDetailScreen.tsx
git commit -m "feat: add InvoiceDetailScreen"
```

---

## Task 15: Mobile App - PDF Generation

**Files:**
- Create: `Conto/app/utils/invoicePdf.ts`
- Modify: `Conto/app/screens/InvoiceDetailScreen.tsx` (add PDF button handler)

**Step 1: Install expo-print and expo-sharing**

```bash
cd Conto && npx expo install expo-print expo-sharing
```

**Step 2: Create PDF template utility**

Create `Conto/app/utils/invoicePdf.ts`:

```typescript
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

import type { Invoice, Party, Organization, Tax } from "@/services/api/types"

function resolveParty(party: string | Party): { name: string; gstNumber?: string; companyAddress?: any } {
  if (typeof party === "string") return { name: party }
  return party
}

function resolveOrg(org: string | Organization): { name: string } {
  if (typeof org === "string") return { name: org }
  return org
}

function resolveTaxName(tax: string | Tax): string {
  if (typeof tax === "string") return tax
  return tax.name
}

export function generateInvoiceHtml(invoice: Invoice): string {
  const party = resolveParty(invoice.party)
  const org = resolveOrg(invoice.organization)

  const lineItemsHtml = invoice.lineItems
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${item.rate.toLocaleString("en-IN")}</td>
      <td style="text-align:right">${(item.amount || 0).toLocaleString("en-IN")}</td>
    </tr>`,
    )
    .join("")

  const taxesHtml = (invoice.taxes || [])
    .map(
      (t) => `
    <tr>
      <td colspan="4" style="text-align:right">${resolveTaxName(t.taxType)}</td>
      <td style="text-align:right">${t.taxAmount.toLocaleString("en-IN")}</td>
    </tr>`,
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #1a1a2e; margin-bottom: 4px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .meta { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f4f4f4; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; }
        .totals td { font-weight: bold; border-top: 2px solid #333; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-draft { background: #e0e0e0; }
        .status-sent { background: #bbdefb; }
        .status-partially_paid { background: #fff9c4; }
        .status-paid { background: #c8e6c9; }
        .status-overdue { background: #ffcdd2; }
        .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>INVOICE</h1>
          <p class="meta">${invoice.invoiceNumber}</p>
        </div>
        <div style="text-align:right">
          <strong>${org.name}</strong>
          <p class="meta">
            Issue Date: ${new Date(invoice.issueDate).toLocaleDateString("en-IN")}<br/>
            Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      <div>
        <strong>Bill To:</strong><br/>
        ${party.name}<br/>
        ${party.gstNumber ? `GST: ${party.gstNumber}<br/>` : ""}
        ${party.companyAddress ? `${party.companyAddress.street || ""}, ${party.companyAddress.city || ""}, ${party.companyAddress.state || ""} ${party.companyAddress.pincode || ""}` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th style="text-align:right">Qty</th>
            <th style="text-align:right">Rate</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
          <tr>
            <td colspan="4" style="text-align:right"><strong>Subtotal</strong></td>
            <td style="text-align:right"><strong>${invoice.subtotal.toLocaleString("en-IN")}</strong></td>
          </tr>
          ${taxesHtml}
          <tr class="totals">
            <td colspan="4" style="text-align:right">Total</td>
            <td style="text-align:right">${invoice.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align:right">Paid</td>
            <td style="text-align:right">${invoice.paidAmount.toLocaleString("en-IN")}</td>
          </tr>
          <tr class="totals">
            <td colspan="4" style="text-align:right">Balance Due</td>
            <td style="text-align:right">${invoice.balanceDue.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><br/>${invoice.notes}</div>` : ""}

      <span class="status status-${invoice.status}">${invoice.status.replace("_", " ")}</span>
    </body>
    </html>
  `
}

export async function generateAndShareInvoicePdf(invoice: Invoice): Promise<void> {
  const html = generateInvoiceHtml(invoice)
  const { uri } = await Print.printToFileAsync({ html })
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Invoice ${invoice.invoiceNumber}`,
    UTI: "com.adobe.pdf",
  })
}
```

**Step 3: Wire up the Download PDF button in InvoiceDetailScreen**

Add to InvoiceDetailScreen's action buttons:

```typescript
import { generateAndShareInvoicePdf } from "@/utils/invoicePdf"

// In the component:
const handleDownloadPdf = useCallback(async () => {
  if (invoice) {
    await generateAndShareInvoicePdf(invoice)
  }
}, [invoice])
```

**Step 4: Commit**

```bash
cd Conto && git add app/utils/invoicePdf.ts app/screens/InvoiceDetailScreen.tsx
git commit -m "feat: add client-side PDF generation for invoices"
```

---

## Task 16: Mobile App - Dashboard Entry Point

**Files:**
- Modify: `Conto/app/screens/ProjectListScreen.tsx` (or Dashboard screen)

**Step 1: Add Invoices navigation entry**

Add a button/card on the Dashboard/ProjectList screen that navigates to InvoiceListScreen. This could be a row at the top or a card alongside projects. Follow existing patterns — e.g., a TouchableOpacity card that calls `navigation.navigate("InvoiceList")`.

**Step 2: Add invoice count/summary to TransactionDetailScreen**

In TransactionDetailScreen, add a "Linked Invoices" section that queries `invoice-payments` where `transaction equals this.id`, and renders the linked invoices with allocated amounts.

**Step 3: Add invoices tab to PartyDetailScreen**

In PartyDetailScreen, add an "Invoices" section that queries invoices where `party equals this.id`, showing a summary list.

**Step 4: Commit**

```bash
cd Conto && git add app/screens/ProjectListScreen.tsx app/screens/TransactionDetailScreen.tsx app/screens/PartyDetailScreen.tsx
git commit -m "feat: add invoice entry points to dashboard, transaction, and party screens"
```

---

## Task 17: Verify & Deploy

**Step 1: Run backend lint**

```bash
cd cloudbac-conto && pnpm lint
```

**Step 2: Run backend tests**

```bash
cd cloudbac-conto && pnpm test:int
```

**Step 3: Run backend build**

```bash
cd cloudbac-conto && pnpm build
```

**Step 4: Run mobile TypeScript check**

```bash
cd Conto && pnpm run compile
```

**Step 5: Run mobile lint**

```bash
cd Conto && pnpm run lint
```

**Step 6: Final commit**

Fix any lint or type errors, then commit fixes.

```bash
git add -A && git commit -m "fix: lint and type fixes for invoicing feature"
```
