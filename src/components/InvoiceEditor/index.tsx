import type { DocumentViewServerProps } from 'payload'
import InvoiceEditView from './InvoiceEditView'

export default async function InvoiceEditor({ doc, initPageResult }: DocumentViewServerProps) {
  const { req } = initPageResult

  const [partiesResult, projectsResult, taxesResult] = await Promise.all([
    req.payload.find({
      collection: 'parties',
      req,
      overrideAccess: false,
      user: req.user,
      pagination: false,
      depth: 0,
      select: { name: true },
    }),
    req.payload.find({
      collection: 'projects',
      req,
      overrideAccess: false,
      user: req.user,
      pagination: false,
      depth: 0,
      select: { title: true },
    }),
    req.payload.find({
      collection: 'taxes',
      req,
      overrideAccess: false,
      user: req.user,
      pagination: false,
      depth: 0,
      select: { name: true, rate: true },
    }),
  ])

  const partyOptions = partiesResult.docs.map((p) => ({
    label: p.name,
    value: p.id,
  }))

  const projectOptions = projectsResult.docs.map((p) => ({
    label: p.title,
    value: p.id,
  }))

  const taxOptions = taxesResult.docs.map((t) => ({
    label: `${t.name} (${t.rate}%)`,
    value: t.id,
    rate: t.rate ?? 0,
  }))

  return (
    <InvoiceEditView
      invoiceData={doc ? JSON.parse(JSON.stringify(doc)) : null}
      partyOptions={partyOptions}
      projectOptions={projectOptions}
      taxOptions={taxOptions}
    />
  )
}
