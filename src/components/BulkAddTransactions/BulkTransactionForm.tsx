'use client'

import { useState, useCallback } from 'react'
import { Button, toast } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui'
import { Gutter } from '@payloadcms/ui'
import TransactionRow, {
  type TransactionRowData,
  type RowStatus,
  type TaxEntry,
} from './TransactionRow'

type SelectOption = { label: string; value: string }

type Props = {
  fromToOptions: SelectOption[]
  projectOptions: SelectOption[]
  userOptions: SelectOption[]
  categoryOptions: SelectOption[]
  taxTypeOptions: SelectOption[]
}

const transferTypeOptions: SelectOption[] = [
  { label: 'Bank', value: 'bank' },
  { label: 'Liquid Cash', value: 'liquid_cash' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Crypto', value: 'crypto' },
]

const projectImpactOptions: SelectOption[] = [
  { label: 'N/A', value: 'na' },
  { label: 'Debit', value: 'debit' },
  { label: 'Credit', value: 'credit' },
]

/** Parse a composite "collection:id" value into polymorphic relationship format */
const parsePolymorphicValue = (composite: string): { relationTo: string; value: string } => {
  const colonIndex = composite.indexOf(':')
  return {
    relationTo: composite.slice(0, colonIndex),
    value: composite.slice(colonIndex + 1),
  }
}

const createEmptyRow = (): TransactionRowData => ({
  clientId: crypto.randomUUID(),
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  transferType: '',
  fromParty: '',
  toParty: '',
  project: '',
  projectImpact: 'na',
  mainPartyFrom: '',
  mainPartyTo: '',
  remarks: '',
  toBeReviewed: true,
  categories: [],
  taxes: [],
})

const duplicateRow = (row: TransactionRowData): TransactionRowData => ({
  ...row,
  clientId: crypto.randomUUID(),
})

export default function BulkTransactionForm({
  fromToOptions,
  projectOptions,
  userOptions,
  categoryOptions,
  taxTypeOptions,
}: Props) {
  const [rows, setRows] = useState<TransactionRowData[]>([createEmptyRow()])
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (index: number, field: keyof TransactionRowData, value: unknown) => {
      setRows((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: value }
        return next
      })
    },
    [],
  )

  const handleAdd = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()])
  }, [])

  const handleDuplicate = useCallback((index: number) => {
    setRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, duplicateRow(prev[index]))
      return next
    })
  }, [])

  const handleRemove = useCallback((index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    const newStatuses: Record<string, RowStatus> = {}
    const newErrors: Record<string, string> = {}
    let successCount = 0
    let errorCount = 0

    for (const row of rows) {
      if (statuses[row.clientId] === 'success') {
        newStatuses[row.clientId] = 'success'
        successCount++
        continue
      }

      newStatuses[row.clientId] = 'submitting'
      setStatuses({ ...newStatuses })

      try {
        const body: Record<string, unknown> = {
          amount: Number(row.amount),
          date: row.date,
          transferType: row.transferType,
          fromParty: parsePolymorphicValue(row.fromParty),
          toParty: parsePolymorphicValue(row.toParty),
          toBeReviewed: row.toBeReviewed,
        }

        if (row.project) body.project = row.project
        if (row.projectImpact) body.projectImpact = row.projectImpact
        if (row.mainPartyFrom) body.mainPartyFrom = row.mainPartyFrom
        if (row.mainPartyTo) body.mainPartyTo = row.mainPartyTo
        if (row.remarks) body.remarks = row.remarks
        if (row.categories.length > 0) body.categories = row.categories
        if (row.taxes.length > 0) {
          body.taxes = row.taxes
            .filter((t) => t.taxType && t.taxAmount)
            .map((t) => ({ taxType: t.taxType, taxAmount: Number(t.taxAmount) }))
        }

        const res = await fetch('/api/transactions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data: { errors?: { message: string }[] } | null =
            await res.json().catch((): null => null)
          const msg =
            data?.errors?.map((e) => e.message).join(', ') || `HTTP ${res.status}`
          throw new Error(msg)
        }

        newStatuses[row.clientId] = 'success'
        successCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        newStatuses[row.clientId] = 'error'
        newErrors[row.clientId] = msg
        errorCount++
      }

      setStatuses({ ...newStatuses })
      setErrors({ ...newErrors })
    }

    setIsSubmitting(false)

    if (errorCount === 0) {
      toast.success(`All ${successCount} transaction(s) created successfully.`)
    } else {
      toast.error(`${successCount} succeeded, ${errorCount} failed. Fix errors and retry.`)
    }
  }, [rows, statuses])

  const pendingRows = rows.filter((r) => statuses[r.clientId] !== 'success')

  return (
    <Gutter>
      <SetStepNav
        nav={[
          { label: 'Transactions', url: '/admin/collections/transactions' },
          { label: 'Bulk Add' },
        ]}
      />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Bulk Add Transactions</h1>
        <p style={{ marginTop: 8, color: 'var(--theme-elevation-500)' }}>
          Add multiple transactions at once. Use &quot;Duplicate&quot; to copy a row.
        </p>
      </div>

      {rows.map((row, index) => (
        <TransactionRow
          key={row.clientId}
          index={index}
          row={row}
          status={statuses[row.clientId] || 'idle'}
          errorMessage={errors[row.clientId]}
          fromToOptions={fromToOptions}
          projectOptions={projectOptions}
          projectImpactOptions={projectImpactOptions}
          userOptions={userOptions}
          transferTypeOptions={transferTypeOptions}
          categoryOptions={categoryOptions}
          taxTypeOptions={taxTypeOptions}
          onChange={handleChange}
          onDuplicate={handleDuplicate}
          onRemove={handleRemove}
          canRemove={rows.length > 1}
        />
      ))}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={handleAdd}
          disabled={isSubmitting}
        >
          + Add Row
        </Button>

        <Button
          size="small"
          onClick={handleSubmit}
          disabled={isSubmitting || pendingRows.length === 0}
        >
          {isSubmitting
            ? 'Submitting...'
            : `Submit ${pendingRows.length} Transaction${pendingRows.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </Gutter>
  )
}
