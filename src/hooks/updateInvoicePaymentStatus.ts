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
