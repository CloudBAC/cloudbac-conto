import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

type User = {
  id: string
  roles?: 'super_admin' | 'org_user'
  organization?: string | { id: string }
}

export const isAdmin = (user: User | null | undefined): boolean =>
  user?.roles === 'super_admin'

const getOrgId = (user: User | null | undefined): string | undefined => {
  if (!user?.organization) return undefined
  return typeof user.organization === 'object' ? user.organization.id : user.organization
}

export const getOrgAndDescendantIds = async (
  req: PayloadRequest,
  orgId: string,
): Promise<string[]> => {
  const cacheKey = `orgDescendants_${orgId}`
  if (req.context[cacheKey]) return req.context[cacheKey] as string[]

  const allOrgs = await req.payload.find({
    collection: 'organizations',
    depth: 0,
    pagination: false,
    select: { parent: true },
  })

  const adjacency = new Map<string, string[]>()
  for (const org of allOrgs.docs) {
    const parentId =
      typeof org.parent === 'object' && org.parent !== null
        ? org.parent.id
        : (org.parent as string | undefined | null)
    if (parentId != null) {
      if (!adjacency.has(parentId)) adjacency.set(parentId, [])
      adjacency.get(parentId)!.push(org.id)
    }
  }

  const result: string[] = [orgId]
  const queue = [orgId]
  while (queue.length > 0) {
    const current = queue.shift()!
    const children = adjacency.get(current) || []
    for (const child of children) {
      result.push(child)
      queue.push(child)
    }
  }

  req.context[cacheKey] = result
  return result
}

export const isAdminAccess: Access = ({ req: { user } }) => isAdmin(user as User | null)

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const tenantIsolation: Access = async ({ req }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true

  const orgId = getOrgId(user)
  if (!orgId) return false

  const orgIds = await getOrgAndDescendantIds(req, orgId)
  return { organization: { in: orgIds } } as Where
}

export const tenantCreate: Access = async ({ req, data }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true
  if (!user) return false

  const orgId = getOrgId(user)
  if (!orgId) return false

  if (data?.organization) {
    const orgIds = await getOrgAndDescendantIds(req, orgId)
    return orgIds.includes(data.organization as string)
  }

  return true
}

export const adminOrSelf: Access = ({ req: { user } }) => {
  const u = user as unknown as User | null
  if (isAdmin(u)) return true
  if (!u) return false
  return { id: { equals: u.id } }
}

export const tenantIsolationOrgs: Access = async ({ req }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true

  const orgId = getOrgId(user)
  if (!orgId) return false

  const orgIds = await getOrgAndDescendantIds(req, orgId)
  return { id: { in: orgIds } } as Where
}

export const tenantDelete: Access = async ({ req }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true

  const orgId = getOrgId(user)
  if (!orgId) return false

  const orgIds = await getOrgAndDescendantIds(req, orgId)
  return { organization: { in: orgIds } } as Where
}

export const tenantCreateOrg: Access = async ({ req, data }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true
  if (!user) return false

  const orgId = getOrgId(user)
  if (!orgId) return false

  if (data?.parent) {
    const orgIds = await getOrgAndDescendantIds(req, orgId)
    return orgIds.includes(data.parent as string)
  }

  return false
}

export const tenantUpdateOrg: Access = async ({ req }) => {
  const user = req.user as unknown as User | null
  if (isAdmin(user)) return true

  const orgId = getOrgId(user)
  if (!orgId) return false

  const orgIds = await getOrgAndDescendantIds(req, orgId)
  return { id: { in: orgIds } } as Where
}

export const isSuperAdmin: FieldAccess = ({ req }) =>
  (req.user as unknown as User | null)?.roles === 'super_admin'
