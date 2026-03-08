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
