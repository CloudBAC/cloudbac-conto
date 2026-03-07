'use client'

import { ReactSelect } from '@payloadcms/ui'
import { transactionFields } from './autoMatch'

type Props = {
  excelHeader: string
  sampleValue: string
  selectedField: string
  usedFields: Set<string>
  onChange: (value: string) => void
}

export default function FieldMappingRow({
  excelHeader,
  sampleValue,
  selectedField,
  usedFields,
  onChange,
}: Props) {
  const options = [
    { label: '-- Skip --', value: '' },
    ...transactionFields
      .filter((f) => f.value === selectedField || !usedFields.has(f.value))
      .map((f) => ({
        label: `${f.label}${f.required ? ' *' : ''}`,
        value: f.value,
      })),
  ]

  const selected = options.find((o) => o.value === selectedField) ?? options[0]

  return (
    <tr>
      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{excelHeader}</td>
      <td
        style={{
          padding: '8px 12px',
          color: 'var(--theme-elevation-500)',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {sampleValue || '(empty)'}
      </td>
      <td style={{ padding: '8px 12px', minWidth: 220 }}>
        <ReactSelect
          options={options}
          value={selected}
          onChange={(option) => {
            const val = option && typeof option === 'object' && 'value' in option
              ? (option as { value: string }).value
              : ''
            onChange(val)
          }}
        />
      </td>
    </tr>
  )
}
