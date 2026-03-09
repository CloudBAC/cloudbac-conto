'use client'

import { useState, useCallback, useMemo } from 'react'
import { SetStepNav } from '@payloadcms/ui'
import { Gutter } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import styles from './InvoiceEditorForm.module.scss'

type SelectOption = { label: string; value: string; rate?: number }

type LineItem = {
  id: string
  description: string
  quantity: string
  rate: string
  taxTypeId: string
}

type Props = {
  invoiceData: any | null
  partyOptions: SelectOption[]
  projectOptions: SelectOption[]
  taxOptions: SelectOption[]
}

const PAYMENT_TERMS = [
  { label: 'Immediate', value: 'immediate' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 60', value: 'net_60' },
  { label: 'Custom', value: 'custom' },
]

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'DRAFT', className: 'statusDraft' },
  sent: { label: 'SENT', className: 'statusSent' },
  partially_paid: { label: 'PARTIALLY PAID', className: 'statusPartial' },
  paid: { label: 'PAID', className: 'statusPaid' },
  overdue: { label: 'OVERDUE', className: 'statusOverdue' },
  cancelled: { label: 'CANCELLED', className: 'statusCancelled' },
}

function formatDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function createEmptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: '1',
    rate: '',
    taxTypeId: '',
  }
}

export default function InvoiceEditorForm({
  invoiceData,
  partyOptions,
  projectOptions,
  taxOptions,
}: Props) {
  const router = useRouter()
  const isEdit = !!invoiceData

  // Form state
  const [partyId, setPartyId] = useState(
    invoiceData?.party
      ? typeof invoiceData.party === 'string'
        ? invoiceData.party
        : invoiceData.party.id
      : '',
  )
  const [projectId, setProjectId] = useState(
    invoiceData?.project
      ? typeof invoiceData.project === 'string'
        ? invoiceData.project
        : invoiceData.project.id
      : '',
  )
  const [issueDate, setIssueDate] = useState(
    invoiceData?.issueDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
  )
  const [dueDate, setDueDate] = useState(
    invoiceData?.dueDate?.split('T')[0] ?? formatDateOffset(30),
  )
  const [paymentTerms, setPaymentTerms] = useState(invoiceData?.paymentTerms ?? 'net_30')
  const [notes, setNotes] = useState(invoiceData?.notes ?? '')
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (invoiceData?.lineItems?.length) {
      return invoiceData.lineItems.map((li: any) => ({
        id: li.id ?? crypto.randomUUID(),
        description: li.description ?? '',
        quantity: li.quantity?.toString() ?? '1',
        rate: li.rate?.toString() ?? '',
        taxTypeId: li.taxType
          ? typeof li.taxType === 'string'
            ? li.taxType
            : li.taxType.id
          : '',
      }))
    }
    return [createEmptyLine()]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLineChange = useCallback(
    (index: number, field: keyof LineItem, value: string) => {
      setLineItems((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: value }
        return next
      })
    },
    [],
  )

  const addLine = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback((index: number) => {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }, [])

  // Computed values
  const computedLines = useMemo(
    () =>
      lineItems.map((li) => {
        const qty = Number(li.quantity) || 0
        const rate = Number(li.rate) || 0
        const amount = qty * rate
        const taxOpt = taxOptions.find((t) => t.value === li.taxTypeId)
        const taxRate = taxOpt?.rate ?? 0
        const taxAmount = amount * (taxRate / 100)
        return { ...li, amount, taxRate, taxAmount, taxName: taxOpt?.label ?? '' }
      }),
    [lineItems, taxOptions],
  )

  const subtotal = useMemo(() => computedLines.reduce((s, l) => s + l.amount, 0), [computedLines])
  const totalTax = useMemo(
    () => computedLines.reduce((s, l) => s + l.taxAmount, 0),
    [computedLines],
  )
  const totalAmount = subtotal + totalTax

  const partyName = partyOptions.find((p) => p.value === partyId)?.label

  const handleSubmit = useCallback(async () => {
    if (!partyId) {
      toast.error('Please select a customer.')
      return
    }
    if (lineItems.some((li) => !li.description || !li.rate)) {
      toast.error('Please fill in all line item details.')
      return
    }

    setIsSubmitting(true)

    const body: Record<string, unknown> = {
      party: partyId,
      issueDate,
      dueDate,
      paymentTerms,
      lineItems: lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        rate: Number(li.rate),
        ...(li.taxTypeId ? { taxType: li.taxTypeId } : {}),
      })),
    }
    if (projectId) body.project = projectId
    if (notes) body.notes = notes

    try {
      const url = isEdit ? `/api/invoices/${invoiceData.id}` : '/api/invoices'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data: { errors?: { message: string }[] } | null = await res
          .json()
          .catch((): null => null)
        const msg = data?.errors?.map((e) => e.message).join(', ') || `HTTP ${res.status}`
        throw new Error(msg)
      }

      toast.success(isEdit ? 'Invoice updated.' : 'Invoice created.')
      router.push('/admin/collections/invoices')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }, [partyId, projectId, issueDate, dueDate, paymentTerms, notes, lineItems, isEdit, invoiceData, router])

  const statusInfo = invoiceData?.status ? STATUS_MAP[invoiceData.status] : null

  return (
    <Gutter>
      <SetStepNav
        nav={[
          { label: 'Invoices', url: '/admin/collections/invoices' },
          { label: isEdit ? `Edit ${invoiceData.invoiceNumber ?? 'Invoice'}` : 'New Invoice' },
        ]}
      />

      <div className={styles.page}>
        {/* ─── HEADER ─── */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {isEdit ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            {isEdit && invoiceData.invoiceNumber && (
              <span className={styles.invoiceNumber}>{invoiceData.invoiceNumber}</span>
            )}
          </div>
          {statusInfo && (
            <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* ─── CUSTOMER & PROJECT ─── */}
        <div className={styles.section}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.fieldLabel}>Customer Name *</label>
              <select
                className={styles.selectField}
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
              >
                <option value="">Select customer...</option>
                {partyOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.fieldLabel}>Project</label>
              <select
                className={styles.selectField}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">None</option>
                {projectOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── INVOICE DETAILS ─── */}
        <div className={styles.section}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Invoice Date *</label>
              <input
                type="date"
                className={styles.inputField}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Terms</label>
              <div className={styles.termsChips}>
                {PAYMENT_TERMS.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    className={`${styles.termChip} ${paymentTerms === pt.value ? styles.termChipActive : ''}`}
                    onClick={() => setPaymentTerms(pt.value)}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Due Date *</label>
              <input
                type="date"
                className={styles.inputField}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─── ITEM TABLE ─── */}
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Item Table</span>
          </div>

          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th className={styles.thDescription}>ITEM DETAILS</th>
                <th className={styles.thNumber}>QUANTITY</th>
                <th className={styles.thNumber}>RATE</th>
                <th className={styles.thNumber}>TAX</th>
                <th className={styles.thAmount}>AMOUNT</th>
                <th className={styles.thAction}></th>
              </tr>
            </thead>
            <tbody>
              {computedLines.map((line, idx) => (
                <tr key={line.id} className={styles.itemRow}>
                  <td className={styles.tdDescription}>
                    <input
                      type="text"
                      className={styles.cellInput}
                      placeholder="Item description"
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td className={styles.tdNumber}>
                    <input
                      type="number"
                      className={`${styles.cellInput} ${styles.cellInputCenter}`}
                      placeholder="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      min="0.01"
                      step="any"
                    />
                  </td>
                  <td className={styles.tdNumber}>
                    <input
                      type="number"
                      className={`${styles.cellInput} ${styles.cellInputRight}`}
                      placeholder="0.00"
                      value={line.rate}
                      onChange={(e) => handleLineChange(idx, 'rate', e.target.value)}
                      min="0"
                      step="any"
                    />
                  </td>
                  <td className={styles.tdNumber}>
                    <select
                      className={styles.cellSelect}
                      value={line.taxTypeId}
                      onChange={(e) => handleLineChange(idx, 'taxTypeId', e.target.value)}
                    >
                      <option value="">No Tax</option>
                      {taxOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.tdAmount}>
                    <span className={styles.amountValue}>
                      {line.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className={styles.tdAction}>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeLine(idx)}
                        title="Remove row"
                      >
                        &times;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.addRowArea}>
            <button type="button" className={styles.addRowBtn} onClick={addLine}>
              + Add New Row
            </button>
          </div>
        </div>

        {/* ─── TOTALS ─── */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsRight}>
            <div className={styles.totalLine}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalValue}>
                {subtotal.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {totalTax > 0 && (
              <div className={styles.totalLine}>
                <span className={styles.totalLabel}>Tax</span>
                <span className={styles.totalValue}>
                  {totalTax.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className={`${styles.totalLine} ${styles.totalLineGrand}`}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValueGrand}>
                {totalAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ─── NOTES ─── */}
        <div className={styles.section}>
          <label className={styles.fieldLabel}>Customer Notes</label>
          <textarea
            className={styles.notesArea}
            placeholder="Additional notes for the customer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* ─── ACTIONS ─── */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push('/admin/collections/invoices')}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </Gutter>
  )
}
