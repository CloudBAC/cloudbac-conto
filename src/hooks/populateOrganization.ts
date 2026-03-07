import type { CollectionBeforeChangeHook } from 'payload'

type User = {
  id: string
  roles?: 'super_admin' | 'org_user'
  organization?: string | { id: string }
}

export const populateOrganization: CollectionBeforeChangeHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const user = req.user as unknown as User | null
  if (!user) return data

  if (user.roles === 'super_admin' && data.organization) {
    return data
  }

  if (user.organization) {
    const orgId =
      typeof user.organization === 'object' ? user.organization.id : user.organization
    data.organization = orgId
  }

  return data
}
