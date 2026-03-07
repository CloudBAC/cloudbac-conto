/** Map of transaction field names to common Excel column header aliases */
const fieldAliases: Record<string, string[]> = {
  amount: ['amount', 'amt', 'value', 'total'],
  date: ['date', 'transaction date', 'txn date'],
  transferType: ['transfer type', 'type', 'payment type', 'mode'],
  fromParty: ['from party', 'from', 'sender', 'payer', 'paid by'],
  toParty: ['to party', 'to', 'receiver', 'payee', 'paid to'],
  project: ['project', 'project name'],
  projectImpact: ['project impact', 'impact', 'debit/credit'],
  mainPartyFrom: ['main party from', 'main from', 'primary from'],
  mainPartyTo: ['main party to', 'main to', 'primary to'],
  remarks: ['remarks', 'notes', 'description', 'comment', 'memo'],
  toBeReviewed: ['to be reviewed', 'review', 'needs review'],
  categories: ['categories', 'category', 'tags'],
}

/**
 * Given an Excel column header, find the best-matching transaction field name.
 * Returns the field name or null if no match found.
 */
export function autoMatchField(header: string): string | null {
  const normalized = header.trim().toLowerCase()

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    if (aliases.includes(normalized)) {
      return field
    }
  }

  return null
}

/** Auto-match all Excel column headers, returning a mapping of columnIndex → fieldName (or empty string) */
export function autoMatchAll(headers: string[]): string[] {
  const used = new Set<string>()
  const result: string[] = []

  for (const header of headers) {
    const match = autoMatchField(header)
    if (match && !used.has(match)) {
      used.add(match)
      result.push(match)
    } else {
      result.push('')
    }
  }

  return result
}

/** All importable transaction fields with labels */
export const transactionFields = [
  { value: 'amount', label: 'Amount', required: true },
  { value: 'date', label: 'Date', required: true },
  { value: 'transferType', label: 'Transfer Type', required: true },
  { value: 'fromParty', label: 'From Party', required: true },
  { value: 'toParty', label: 'To Party', required: true },
  { value: 'project', label: 'Project', required: false },
  { value: 'projectImpact', label: 'Project Impact', required: false },
  { value: 'mainPartyFrom', label: 'Main Party From', required: false },
  { value: 'mainPartyTo', label: 'Main Party To', required: false },
  { value: 'remarks', label: 'Remarks', required: false },
  { value: 'toBeReviewed', label: 'To Be Reviewed', required: false },
  { value: 'categories', label: 'Categories', required: false },
] as const

export type TransactionFieldName = (typeof transactionFields)[number]['value']
