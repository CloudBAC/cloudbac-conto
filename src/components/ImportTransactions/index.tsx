import type { AdminViewServerProps } from 'payload'
import ImportTransactionsForm from './ImportTransactionsForm'

export default async function ImportTransactions({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult

  const [partiesResult, projectsResult, usersResult, categoriesResult] = await Promise.all([
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
      select: { name: true, type: true },
      where: { type: { equals: 'transaction' } },
    }),
  ])

  const parties = partiesResult.docs.map((p) => ({ id: p.id, name: p.name as string }))
  const projects = projectsResult.docs.map((p) => ({ id: p.id, title: p.title as string }))
  const users = usersResult.docs.map((u) => ({
    id: u.id,
    name: (u.name as string) || '',
    email: u.email,
  }))
  const categories = categoriesResult.docs.map((c) => ({ id: c.id, name: c.name as string }))

  return (
    <ImportTransactionsForm
      parties={parties}
      projects={projects}
      users={users}
      categories={categories}
    />
  )
}
