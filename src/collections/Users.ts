import type { CollectionConfig } from 'payload'
import {
  isAdminAccess,
  adminOrSelf,
  tenantIsolation,
  isSuperAdmin,
} from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: isAdminAccess,
    read: tenantIsolation,
    update: adminOrSelf,
    delete: isAdminAccess,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Org User', value: 'org_user' },
      ],
      required: true,
      defaultValue: 'org_user',
      saveToJWT: true,
      access: {
        update: isSuperAdmin,
      },
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      saveToJWT: true,
      access: {
        update: isSuperAdmin,
      },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
        if (siblingData?.roles === 'org_user' && !value) {
          return 'Organization is required for org users'
        }
        return true
      },
      admin: {
        condition: (data) => data?.roles === 'org_user',
      },
    },
  ],
}
