import type { AdminViewServerProps } from 'payload'
import BulkTransactionForm from './BulkTransactionForm'

export default async function BulkAddTransactions({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult

  const [partiesResult, projectsResult, usersResult, categoriesResult, taxesResult] =
    await Promise.all([
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
        collection: 'users',
        req,
        overrideAccess: false,
        user: req.user,
        pagination: false,
        depth: 0,
        select: { email: true, name: true },
      }),
      req.payload.find({
        collection: 'categories',
        req,
        overrideAccess: false,
        user: req.user,
        pagination: false,
        depth: 0,
        where: { type: { equals: 'transaction' } },
        select: { name: true },
      }),
      req.payload.find({
        collection: 'taxes',
        req,
        overrideAccess: false,
        user: req.user,
        pagination: false,
        depth: 0,
        select: { name: true },
      }),
    ])

  // Build combined from/to options with "collection:id" composite values
  const partyFromToOptions = partiesResult.docs.map((p) => ({
    label: `Party: ${p.name}`,
    value: `parties:${p.id}`,
  }))

  const userFromToOptions = usersResult.docs.map((u) => ({
    label: `User: ${u.name || u.email}`,
    value: `users:${u.id}`,
  }))

  const fromToOptions = [...partyFromToOptions, ...userFromToOptions]

  const projectOptions = projectsResult.docs.map((p) => ({
    label: p.title,
    value: p.id,
  }))

  const userOptions = usersResult.docs.map((u) => ({
    label: u.email,
    value: u.id,
  }))

  const categoryOptions = categoriesResult.docs.map((c) => ({
    label: c.name,
    value: c.id,
  }))

  const taxTypeOptions = taxesResult.docs.map((t) => ({
    label: t.name,
    value: t.id,
  }))

  return (
    <BulkTransactionForm
      fromToOptions={fromToOptions}
      projectOptions={projectOptions}
      userOptions={userOptions}
      categoryOptions={categoryOptions}
      taxTypeOptions={taxTypeOptions}
    />
  )
}
