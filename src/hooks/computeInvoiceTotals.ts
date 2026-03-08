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
