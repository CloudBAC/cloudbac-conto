import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })

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
