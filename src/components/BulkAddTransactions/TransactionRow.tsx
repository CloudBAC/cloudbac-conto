'use client'

import type { OptionObject } from 'payload'
import { Banner } from '@payloadcms/ui'
import { ReactSelect } from '@payloadcms/ui'

export type TaxEntry = {
  id: string
  taxType: string
  taxAmount: string
}

export type TransactionRowData = {
  clientId: string
  amount: string
  date: string
  transferType: string
  fromParty: string // format: "parties:id" or "users:id"
  toParty: string // format: "parties:id" or "users:id"
  project: string
  projectImpact: string
  mainPartyFrom: string
  mainPartyTo: string
  remarks: string
  toBeReviewed: boolean
  categories: string[]
  taxes: TaxEntry[]
}

export type RowStatus = 'idle' | 'submitting' | 'success' | 'error'

type SelectOption = { label: string; value: string }

type Props = {
  index: number
  row: TransactionRowData
  status: RowStatus
  errorMessage?: string
  fromToOptions: SelectOption[]
  projectOptions: SelectOption[]
  projectImpactOptions: SelectOption[]
  userOptions: SelectOption[]
  transferTypeOptions: SelectOption[]
  categoryOptions: SelectOption[]
  taxTypeOptions: SelectOption[]
  onChange: (index: number, field: keyof TransactionRowData, value: unknown) => void
  onDuplicate: (index: number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export default function TransactionRow({
  index,
  row,
  status,
  errorMessage,
  fromToOptions,
  projectOptions,
  projectImpactOptions,
  userOptions,
  transferTypeOptions,
  categoryOptions,
  taxTypeOptions,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}: Props) {
  const disabled = status === 'submitting' || status === 'success'

  const borderColor =
    status === 'success'
      ? 'var(--theme-success-500, #22c55e)'
      : status === 'error'
        ? 'var(--theme-error-500, #ef4444)'
        : 'var(--theme-elevation-150, #ddd)'

  const findOption = (options: SelectOption[], value: string): OptionObject | undefined =>
    options.find((o) => o.value === value) as OptionObject | undefined

  return (
    <div
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <strong>Row {index + 1}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDuplicate(index)}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            disabled={disabled || !canRemove}
            onClick={() => onRemove(index)}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              cursor: disabled || !canRemove ? 'not-allowed' : 'pointer',
              color: canRemove ? 'var(--theme-error-500, #ef4444)' : undefined,
            }}
          >
            Remove
          </button>
        </div>
      </div>

      {status === 'error' && errorMessage && (
        <Banner type="error">
          {errorMessage}
        </Banner>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {/* Amount */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            Amount <span style={{ color: 'var(--theme-error-500)' }}>*</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            disabled={disabled}
            value={row.amount}
            onChange={(e) => onChange(index, 'amount', e.target.value)}
            style={{ width: '100%', padding: '6px 8px' }}
          />
        </div>

        {/* Date */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            Date <span style={{ color: 'var(--theme-error-500)' }}>*</span>
          </label>
          <input
            type="date"
            disabled={disabled}
            value={row.date}
            onChange={(e) => onChange(index, 'date', e.target.value)}
            style={{ width: '100%', padding: '6px 8px' }}
          />
        </div>

        {/* Transfer Type */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            Transfer Type <span style={{ color: 'var(--theme-error-500)' }}>*</span>
          </label>
          <ReactSelect
            disabled={disabled}
            value={findOption(transferTypeOptions, row.transferType)}
            onChange={(option) =>
              onChange(index, 'transferType', (option as OptionObject)?.value ?? '')
            }
            options={transferTypeOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* From Party */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            From Party <span style={{ color: 'var(--theme-error-500)' }}>*</span>
          </label>
          <ReactSelect
            disabled={disabled}
            value={findOption(fromToOptions, row.fromParty)}
            onChange={(option) =>
              onChange(index, 'fromParty', (option as OptionObject)?.value ?? '')
            }
            options={fromToOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* To Party */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            To Party <span style={{ color: 'var(--theme-error-500)' }}>*</span>
          </label>
          <ReactSelect
            disabled={disabled}
            value={findOption(fromToOptions, row.toParty)}
            onChange={(option) => onChange(index, 'toParty', (option as OptionObject)?.value ?? '')}
            options={fromToOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* Project */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Project</label>
          <ReactSelect
            disabled={disabled}
            value={findOption(projectOptions, row.project)}
            onChange={(option) => onChange(index, 'project', (option as OptionObject)?.value ?? '')}
            options={projectOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* Project Impact */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Project Impact</label>
          <ReactSelect
            disabled={disabled}
            value={findOption(projectImpactOptions, row.projectImpact)}
            onChange={(option) =>
              onChange(index, 'projectImpact', (option as OptionObject)?.value ?? 'na')
            }
            options={projectImpactOptions as OptionObject[]}
            isClearable={false}
          />
        </div>

        {/* Main Party From */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            Main Party From
          </label>
          <ReactSelect
            disabled={disabled}
            value={findOption(userOptions, row.mainPartyFrom)}
            onChange={(option) =>
              onChange(index, 'mainPartyFrom', (option as OptionObject)?.value ?? '')
            }
            options={userOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* Main Party To */}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Main Party To</label>
          <ReactSelect
            disabled={disabled}
            value={findOption(userOptions, row.mainPartyTo)}
            onChange={(option) =>
              onChange(index, 'mainPartyTo', (option as OptionObject)?.value ?? '')
            }
            options={userOptions as OptionObject[]}
            isClearable
          />
        </div>

        {/* Remarks */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Remarks</label>
          <textarea
            disabled={disabled}
            value={row.remarks}
            onChange={(e) => onChange(index, 'remarks', e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '6px 8px', resize: 'vertical' }}
          />
        </div>

        {/* Categories */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Categories</label>
          <ReactSelect
            disabled={disabled}
            value={categoryOptions.filter((o) =>
              row.categories.includes(o.value),
            ) as OptionObject[]}
            onChange={(options) => {
              const selected = (options as OptionObject[])?.map((o) => o.value) ?? []
              onChange(index, 'categories', selected)
            }}
            options={categoryOptions as OptionObject[]}
            isMulti
            isClearable
          />
        </div>

        {/* To Be Reviewed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={row.toBeReviewed}
            onChange={(e) => onChange(index, 'toBeReviewed', e.target.checked)}
          />
          <label style={{ fontSize: 13 }}>To Be Reviewed</label>
        </div>
      </div>

      {/* Taxes */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Taxes</label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const newTaxes: TaxEntry[] = [
                ...row.taxes,
                { id: crypto.randomUUID(), taxType: '', taxAmount: '' },
              ]
              onChange(index, 'taxes', newTaxes)
            }}
            style={{ padding: '2px 8px', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            + Add Tax
          </button>
        </div>
        {row.taxes.map((tax, taxIndex) => (
          <div
            key={tax.id}
            style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}
          >
            <div style={{ flex: 1 }}>
              <ReactSelect
                disabled={disabled}
                value={findOption(taxTypeOptions, tax.taxType)}
                onChange={(option) => {
                  const newTaxes = [...row.taxes]
                  newTaxes[taxIndex] = {
                    ...newTaxes[taxIndex],
                    taxType: (option as OptionObject)?.value ?? '',
                  }
                  onChange(index, 'taxes', newTaxes)
                }}
                options={taxTypeOptions as OptionObject[]}
                isClearable
              />
            </div>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount"
              disabled={disabled}
              value={tax.taxAmount}
              onChange={(e) => {
                const newTaxes = [...row.taxes]
                newTaxes[taxIndex] = { ...newTaxes[taxIndex], taxAmount: e.target.value }
                onChange(index, 'taxes', newTaxes)
              }}
              style={{ width: 120, padding: '6px 8px' }}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const newTaxes = row.taxes.filter((_, i) => i !== taxIndex)
                onChange(index, 'taxes', newTaxes)
              }}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: 'var(--theme-error-500, #ef4444)',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
