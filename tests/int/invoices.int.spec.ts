import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, beforeEach, expect } from 'vitest'

let payload: Payload
let testOrg: any
let testParty: any
let testTax: any
let testUser: any

// Use a unique prefix per run to avoid UNIQUE constraint collisions
const runId = Date.now().toString(36).toUpperCase().slice(-4)

describe('Invoices', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // Seed test org
    testOrg = await payload.create({
      collection: 'organizations',
      data: { name: `Test Org ${runId}`, invoicePrefix: runId, invoiceNextNumber: 1 },
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

    // Seed test user (needed for transaction mainPartyFrom/mainPartyTo)
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: `invoice-test-${Date.now()}@test.com`,
        password: 'test1234',
        organization: testOrg.id,
      },
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

    expect(invoice.invoiceNumber).toBe(`${runId}-0001`)
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
        mainPartyFrom: testUser.id,
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
