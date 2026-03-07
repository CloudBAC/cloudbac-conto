'use client'

import type { ResolvedRow } from './ImportTransactionsForm'
import { transactionFields } from './autoMatch'

type Props = {
  rows: ResolvedRow[]
  mappedFields: string[]
}

type CellStatus = 'valid' | 'error' | 'warning'

function getCellStatus(field: string, value: unknown): CellStatus {
  const required = transactionFields.find((f) => f.value === field)?.required
  if (value === null || value === undefined || value === '') {
    return required ? 'error' : 'warning'
  }
  return 'valid'
}

const statusColors: Record<CellStatus, string> = {
  valid: '#22c55e',
  error: '#ef4444',
  warning: '#eab308',
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'object' && value !== null && 'relationTo' in value) {
    const rel = value as { relationTo: string; value: string; label?: string }
    return rel.label || `${rel.relationTo}:${rel.value}`
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === 'object' && v !== null && 'label' in v) return v.label
      return String(v)
    }).join(', ')
  }
  return String(value)
}

export default function ImportPreviewTable({ rows, mappedFields }: Props) {
  const activeFields = mappedFields.filter(Boolean)
  const fieldLabels = activeFields.map(
    (f) => transactionFields.find((tf) => tf.value === f)?.label || f,
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--theme-elevation-150)' }}>
              #
            </th>
            {fieldLabels.map((label, i) => (
              <th
                key={i}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  borderBottom: '2px solid var(--theme-elevation-150)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
              <td style={{ padding: '6px 12px', color: 'var(--theme-elevation-500)' }}>
                {rowIdx + 1}
              </td>
              {activeFields.map((field, colIdx) => {
                const value = row.data[field]
                const status = getCellStatus(field, value)
                return (
                  <td
                    key={colIdx}
                    style={{
                      padding: '6px 12px',
                      borderLeft: `3px solid ${statusColors[status]}`,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={formatCellValue(value) || (status === 'error' ? 'Required field missing' : 'Empty')}
                  >
                    {formatCellValue(value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
