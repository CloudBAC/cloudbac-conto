'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button, toast } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui'
import { Gutter } from '@payloadcms/ui'
import * as XLSX from 'xlsx'
import { autoMatchAll, transactionFields } from './autoMatch'
import FieldMappingRow from './FieldMappingRow'
import ImportPreviewTable from './ImportPreviewTable'

type Party = { id: string; name: string }
type Project = { id: string; title: string }
type User = { id: string; name: string; email: string }
type Category = { id: string; name: string }

type Props = {
  parties: Party[]
  projects: Project[]
  users: User[]
  categories: Category[]
}

export type ResolvedRow = {
  data: Record<string, unknown>
  hasErrors: boolean
}

type Step = 'upload' | 'map' | 'preview' | 'submit'

const transferTypeMap: Record<string, string> = {
  bank: 'bank',
  'bank transfer': 'bank',
  online: 'bank',
  'liquid cash': 'liquid_cash',
  liquid_cash: 'liquid_cash',
  liquid: 'liquid_cash',
  cash: 'liquid_cash',
  cheque: 'cheque',
  check: 'cheque',
  crypto: 'crypto',
}

const projectImpactMap: Record<string, string> = {
  debit: 'debit',
  credit: 'credit',
  na: 'na',
  'n/a': 'na',
}

export default function ImportTransactionsForm({ parties, projects, users, categories }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [fieldMapping, setFieldMapping] = useState<string[]>([])
  const [submitStatuses, setSubmitStatuses] = useState<('idle' | 'submitting' | 'success' | 'error')[]>([])
  const [submitErrors, setSubmitErrors] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build lookup maps
  const partyLookup = useMemo(() => {
    const map = new Map<string, { relationTo: string; value: string; label: string }>()
    for (const p of parties) {
      map.set(p.name.trim().toLowerCase(), { relationTo: 'parties', value: p.id, label: `Party: ${p.name}` })
    }
    return map
  }, [parties])

  const userLookup = useMemo(() => {
    const map = new Map<string, { relationTo: string; value: string; label: string }>()
    for (const u of users) {
      if (u.name) map.set(u.name.trim().toLowerCase(), { relationTo: 'users', value: u.id, label: `User: ${u.name}` })
      map.set(u.email.trim().toLowerCase(), { relationTo: 'users', value: u.id, label: `User: ${u.name || u.email}` })
    }
    return map
  }, [users])

  const userIdLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of users) {
      if (u.name) map.set(u.name.trim().toLowerCase(), u.id)
      map.set(u.email.trim().toLowerCase(), u.id)
    }
    return map
  }, [users])

  const projectLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) {
      map.set(p.title.trim().toLowerCase(), p.id)
    }
    return map
  }, [projects])

  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) {
      map.set(c.name.trim().toLowerCase(), c.id)
    }
    return map
  }, [categories])

  const resolveParty = useCallback(
    (value: string) => {
      const key = value.trim().toLowerCase()
      return partyLookup.get(key) ?? userLookup.get(key) ?? null
    },
    [partyLookup, userLookup],
  )

  // Step 1: File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })

      if (jsonData.length < 2) {
        toast.error('File must have at least a header row and one data row.')
        return
      }

      const fileHeaders = jsonData[0].map((h) => String(h || '').trim())
      const fileRows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== ''))

      setHeaders(fileHeaders)
      setRawRows(fileRows)
      setFieldMapping(autoMatchAll(fileHeaders))
      setStep('map')
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // Used fields set for mapping step
  const usedFields = useMemo(() => new Set(fieldMapping.filter(Boolean)), [fieldMapping])

  const handleMappingChange = useCallback((colIndex: number, fieldName: string) => {
    setFieldMapping((prev) => {
      const next = [...prev]
      next[colIndex] = fieldName
      return next
    })
  }, [])

  // Resolve rows based on current mapping
  const resolvedRows: ResolvedRow[] = useMemo(() => {
    return rawRows.map((row) => {
      const data: Record<string, unknown> = {}
      let hasErrors = false

      for (let i = 0; i < fieldMapping.length; i++) {
        const field = fieldMapping[i]
        if (!field) continue
        const rawValue = (row[i] ?? '').toString().trim()

        switch (field) {
          case 'amount':
            data.amount = rawValue ? Number(rawValue.replace(/[,$]/g, '')) : ''
            if (!rawValue || isNaN(data.amount as number)) hasErrors = true
            break

          case 'date':
            data.date = rawValue || ''
            if (!rawValue) hasErrors = true
            break

          case 'transferType': {
            const mapped = transferTypeMap[rawValue.toLowerCase()]
            data.transferType = mapped || ''
            if (!mapped) hasErrors = true
            break
          }

          case 'fromParty':
          case 'toParty': {
            const resolved = rawValue ? resolveParty(rawValue) : null
            data[field] = resolved || ''
            if (!resolved) hasErrors = true
            break
          }

          case 'mainPartyFrom':
          case 'mainPartyTo': {
            const userId = rawValue ? userIdLookup.get(rawValue.trim().toLowerCase()) : null
            data[field] = userId || ''
            break
          }

          case 'project': {
            const projectId = rawValue ? projectLookup.get(rawValue.trim().toLowerCase()) : null
            data.project = projectId || ''
            break
          }

          case 'projectImpact': {
            const mapped = rawValue ? projectImpactMap[rawValue.toLowerCase()] : ''
            data.projectImpact = mapped || ''
            break
          }

          case 'toBeReviewed': {
            const lower = rawValue.toLowerCase()
            data.toBeReviewed = lower === 'true' || lower === 'yes' || lower === '1'
            break
          }

          case 'categories': {
            const names = rawValue.split(',').map((n) => n.trim()).filter(Boolean)
            const ids = names
              .map((n) => categoryLookup.get(n.toLowerCase()))
              .filter(Boolean) as string[]
            data.categories = ids.length > 0
              ? ids.map((id) => {
                  const cat = categories.find((c) => c.id === id)
                  return { value: id, label: cat?.name || id }
                })
              : ''
            break
          }

          case 'remarks':
            data.remarks = rawValue
            break
        }
      }

      // Check required fields that are unmapped
      for (const f of transactionFields) {
        if (f.required && !(f.value in data)) {
          hasErrors = true
        }
      }

      return { data, hasErrors }
    })
  }, [rawRows, fieldMapping, resolveParty, userIdLookup, projectLookup, categoryLookup, categories])

  // Step 4: Submit
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    const statuses = new Array(resolvedRows.length).fill('idle') as ('idle' | 'submitting' | 'success' | 'error')[]
    const errors: Record<number, string> = {}
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < resolvedRows.length; i++) {
      const row = resolvedRows[i]
      statuses[i] = 'submitting'
      setSubmitStatuses([...statuses])

      try {
        const body: Record<string, unknown> = {}

        if (row.data.amount !== undefined && row.data.amount !== '') body.amount = Number(row.data.amount)
        if (row.data.date) body.date = row.data.date
        if (row.data.transferType) body.transferType = row.data.transferType
        if (row.data.remarks) body.remarks = row.data.remarks

        // Polymorphic relationships
        if (row.data.fromParty && typeof row.data.fromParty === 'object') {
          const fp = row.data.fromParty as { relationTo: string; value: string }
          body.fromParty = { relationTo: fp.relationTo, value: fp.value }
        }
        if (row.data.toParty && typeof row.data.toParty === 'object') {
          const tp = row.data.toParty as { relationTo: string; value: string }
          body.toParty = { relationTo: tp.relationTo, value: tp.value }
        }

        if (row.data.project) body.project = row.data.project
        if (row.data.projectImpact) body.projectImpact = row.data.projectImpact
        if (row.data.mainPartyFrom) body.mainPartyFrom = row.data.mainPartyFrom
        if (row.data.mainPartyTo) body.mainPartyTo = row.data.mainPartyTo
        if (typeof row.data.toBeReviewed === 'boolean') body.toBeReviewed = row.data.toBeReviewed

        // Categories: extract IDs from objects
        if (Array.isArray(row.data.categories)) {
          body.categories = row.data.categories.map((c: { value: string }) => c.value)
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
          const msg = data?.errors?.map((e) => e.message).join(', ') || `HTTP ${res.status}`
          throw new Error(msg)
        }

        statuses[i] = 'success'
        successCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        statuses[i] = 'error'
        errors[i] = msg
        errorCount++
      }

      setSubmitStatuses([...statuses])
      setSubmitErrors({ ...errors })
    }

    setIsSubmitting(false)

    if (errorCount === 0) {
      toast.success(`All ${successCount} transaction(s) imported successfully.`)
    } else {
      toast.error(`${successCount} succeeded, ${errorCount} failed.`)
    }
  }, [resolvedRows])

  const hasRequiredMapped = useMemo(() => {
    const mapped = new Set(fieldMapping.filter(Boolean))
    return transactionFields
      .filter((f) => f.required)
      .every((f) => mapped.has(f.value))
  }, [fieldMapping])

  const errorRowCount = resolvedRows.filter((r) => r.hasErrors).length
  const previewRows = resolvedRows.slice(0, 20)

  return (
    <Gutter>
      <SetStepNav
        nav={[
          { label: 'Transactions', url: '/admin/collections/transactions' },
          { label: 'Import Excel' },
        ]}
      />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Import Transactions from Excel</h1>
        <p style={{ marginTop: 8, color: 'var(--theme-elevation-500)' }}>
          Upload an Excel or CSV file, map columns to transaction fields, preview, and import.
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['upload', 'map', 'preview', 'submit'] as Step[]).map((s, i) => (
          <div
            key={s}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: step === s ? 700 : 400,
              background: step === s ? 'var(--theme-elevation-100)' : 'transparent',
              color: step === s ? 'var(--theme-text)' : 'var(--theme-elevation-400)',
            }}
          >
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <label
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              border: '2px dashed var(--theme-elevation-200)',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Choose a file</div>
            <div style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>
              .xlsx, .xls, or .csv
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Step 2: Field Mapping */}
      {step === 'map' && (
        <div>
          <p style={{ marginBottom: 16 }}>
            Map each Excel column to a transaction field.
            Fields marked with <strong>*</strong> are required.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--theme-elevation-150)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Excel Column</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sample Value</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Map To</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header, i) => (
                <FieldMappingRow
                  key={i}
                  excelHeader={header}
                  sampleValue={rawRows[0]?.[i] ?? ''}
                  selectedField={fieldMapping[i] || ''}
                  usedFields={usedFields}
                  onChange={(val) => handleMappingChange(i, val)}
                />
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button
              buttonStyle="secondary"
              size="small"
              onClick={() => setStep('upload')}
            >
              Back
            </Button>
            <Button
              size="small"
              onClick={() => setStep('preview')}
              disabled={!hasRequiredMapped}
            >
              Preview ({rawRows.length} rows)
            </Button>
          </div>
          {!hasRequiredMapped && (
            <p style={{ marginTop: 8, color: '#ef4444', fontSize: 13 }}>
              Please map all required fields (Amount, Date, Transfer Type, From Party, To Party) before proceeding.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <p>
              Showing {previewRows.length} of {resolvedRows.length} rows.{' '}
              {errorRowCount > 0 && (
                <span style={{ color: '#ef4444' }}>
                  {errorRowCount} row(s) have validation issues.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#22c55e', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} /> Resolved</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ef4444', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} /> Missing required</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#eab308', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} /> Optional empty</span>
            </div>
          </div>

          <ImportPreviewTable rows={previewRows} mappedFields={fieldMapping} />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button
              buttonStyle="secondary"
              size="small"
              onClick={() => setStep('map')}
            >
              Back to Mapping
            </Button>
            <Button
              size="small"
              onClick={() => {
                setSubmitStatuses(new Array(resolvedRows.length).fill('idle'))
                setSubmitErrors({})
                setStep('submit')
              }}
            >
              Proceed to Import
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Submit */}
      {step === 'submit' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <p>
              Ready to import <strong>{resolvedRows.length}</strong> transactions.
              {errorRowCount > 0 && (
                <span style={{ color: '#eab308' }}>
                  {' '}{errorRowCount} row(s) have issues and may fail.
                </span>
              )}
            </p>
          </div>

          {!isSubmitting && submitStatuses.every((s) => s === 'idle') && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                buttonStyle="secondary"
                size="small"
                onClick={() => setStep('preview')}
              >
                Back to Preview
              </Button>
              <Button size="small" onClick={handleSubmit}>
                Import {resolvedRows.length} Transactions
              </Button>
            </div>
          )}

          {(isSubmitting || submitStatuses.some((s) => s !== 'idle')) && (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--theme-elevation-150)' }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Row</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {submitStatuses.map((status, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
                      <td style={{ padding: '4px 12px' }}>{i + 1}</td>
                      <td style={{ padding: '4px 12px' }}>
                        {status === 'idle' && <span style={{ color: 'var(--theme-elevation-400)' }}>Pending</span>}
                        {status === 'submitting' && <span style={{ color: '#3b82f6' }}>Submitting...</span>}
                        {status === 'success' && <span style={{ color: '#22c55e' }}>Success</span>}
                        {status === 'error' && <span style={{ color: '#ef4444' }}>Error</span>}
                      </td>
                      <td style={{ padding: '4px 12px', color: '#ef4444', fontSize: 12 }}>
                        {submitErrors[i] || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Gutter>
  )
}
