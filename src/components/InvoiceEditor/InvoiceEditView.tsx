'use client'

import { useMemo, useCallback } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import styles from './InvoiceEditorForm.module.scss'

type SelectOption = { label: string; value: string; rate?: number }

type Props = {
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

function formatINR(n: number): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function InvoiceEditView({
  partyOptions,
  projectOptions,
  taxOptions,
}: Props) {
  const [fields, dispatch] = useAllFormFields()

  // Read values from Payload form state
  const partyId = (fields?.party?.value as string) ?? ''
  const projectId = (fields?.project?.value as string) ?? ''
  const issueDate = (fields?.issueDate?.value as string)?.split('T')[0] ?? ''
  const dueDate = (fields?.dueDate?.value as string)?.split('T')[0] ?? ''
  const paymentTerms = (fields?.paymentTerms?.value as string) ?? 'net_30'
  const notes = (fields?.notes?.value as string) ?? ''
  const status = (fields?.status?.value as string) ?? 'draft'
  const invoiceNumber = (fields?.invoiceNumber?.value as string) ?? ''

  const rows = fields?.lineItems?.rows ?? []

  // Dispatch a single field update
  const updateField = useCallback(
    (path: string, value: unknown) => {
      dispatch({ type: 'UPDATE', path, value })
    },
    [dispatch],
  )

  // Build computed line items from form state
  const computedLines = useMemo(() => {
    return rows.map((_row, idx) => {
      const description = (fields?.[`lineItems.${idx}.description`]?.value as string) ?? ''
      const quantity = Number(fields?.[`lineItems.${idx}.quantity`]?.value) || 0
      const rate = Number(fields?.[`lineItems.${idx}.rate`]?.value) || 0
      const taxTypeId = (fields?.[`lineItems.${idx}.taxType`]?.value as string) ?? ''
      const amount = quantity * rate
      const taxOpt = taxOptions.find((t) => t.value === taxTypeId)
      const taxRate = taxOpt?.rate ?? 0
      const taxAmount = amount * (taxRate / 100)
      return { idx, description, quantity, rate, taxTypeId, amount, taxRate, taxAmount }
    })
  }, [rows, fields, taxOptions])

  const subtotal = useMemo(() => computedLines.reduce((s, l) => s + l.amount, 0), [computedLines])
  const totalTax = useMemo(
    () => computedLines.reduce((s, l) => s + l.taxAmount, 0),
    [computedLines],
  )
  const totalAmount = subtotal + totalTax

  const handleAddRow = useCallback(() => {
    dispatch({ type: 'ADD_ROW', path: 'lineItems', schemaPath: 'lineItems' })
  }, [dispatch])

  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      dispatch({ type: 'REMOVE_ROW', path: 'lineItems', rowIndex })
    },
    [dispatch],
  )

  const statusInfo = status ? STATUS_MAP[status] : null

  return (
    <div className={styles.page}>
      {/* ─── HEADER ─── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            {invoiceNumber ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          {invoiceNumber && (
            <span className={styles.invoiceNumber}>{invoiceNumber}</span>
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
              onChange={(e) => updateField('party', e.target.value)}
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
              onChange={(e) => updateField('project', e.target.value || null)}
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
              onChange={(e) => updateField('issueDate', e.target.value)}
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
                  onClick={() => updateField('paymentTerms', pt.value)}
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
              onChange={(e) => updateField('dueDate', e.target.value)}
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
            {computedLines.map((line) => (
              <tr key={rows[line.idx]?.id ?? line.idx} className={styles.itemRow}>
                <td className={styles.tdDescription}>
                  <input
                    type="text"
                    className={styles.cellInput}
                    placeholder="Item description"
                    value={line.description}
                    onChange={(e) =>
                      updateField(`lineItems.${line.idx}.description`, e.target.value)
                    }
                  />
                </td>
                <td className={styles.tdNumber}>
                  <input
                    type="number"
                    className={`${styles.cellInput} ${styles.cellInputCenter}`}
                    placeholder="1"
                    value={line.quantity || ''}
                    onChange={(e) =>
                      updateField(`lineItems.${line.idx}.quantity`, Number(e.target.value) || 0)
                    }
                    min="0.01"
                    step="any"
                  />
                </td>
                <td className={styles.tdNumber}>
                  <input
                    type="number"
                    className={`${styles.cellInput} ${styles.cellInputRight}`}
                    placeholder="0.00"
                    value={line.rate || ''}
                    onChange={(e) =>
                      updateField(`lineItems.${line.idx}.rate`, Number(e.target.value) || 0)
                    }
                    min="0"
                    step="any"
                  />
                </td>
                <td className={styles.tdNumber}>
                  <select
                    className={styles.cellSelect}
                    value={line.taxTypeId}
                    onChange={(e) =>
                      updateField(`lineItems.${line.idx}.taxType`, e.target.value || null)
                    }
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
                  <span className={styles.amountValue}>{formatINR(line.amount)}</span>
                </td>
                <td className={styles.tdAction}>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoveRow(line.idx)}
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
          <button type="button" className={styles.addRowBtn} onClick={handleAddRow}>
            + Add New Row
          </button>
        </div>
      </div>

      {/* ─── TOTALS ─── */}
      <div className={styles.totalsSection}>
        <div className={styles.totalsRight}>
          <div className={styles.totalLine}>
            <span className={styles.totalLabel}>Subtotal</span>
            <span className={styles.totalValue}>{formatINR(subtotal)}</span>
          </div>
          {totalTax > 0 && (
            <div className={styles.totalLine}>
              <span className={styles.totalLabel}>Tax</span>
              <span className={styles.totalValue}>{formatINR(totalTax)}</span>
            </div>
          )}
          <div className={`${styles.totalLine} ${styles.totalLineGrand}`}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValueGrand}>{formatINR(totalAmount)}</span>
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
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}
