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
  console.log('>>> populateOrganization called:', { operation, hasUser: !!req.user, dataOrg: data.organization })

  if (operation !== 'create') return data

  const user = req.user as unknown as User | null
  if (!user) {
    console.log('>>> populateOrganization: no user found')
    return data
  }

  console.log('>>> populateOrganization user:', { roles: user.roles, org: user.organization })

  if (user.roles === 'super_admin' && data.organization) {
    return data
  }

  if (user.organization) {
    const orgId =
      typeof user.organization === 'object' ? user.organization.id : user.organization
    data.organization = orgId
    console.log('>>> populateOrganization set org:', orgId)
  }

  return data
}
