import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantIsolation,
  },
  hooks: {
    beforeChange: [populateOrganization],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'party',
      options: [
        { label: 'Party', value: 'party' },
        { label: 'Transaction', value: 'transaction' },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
        type: { equals: data?.type },
      }),
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      access: {
        update: isSuperAdmin,
      },
    },
  ],
}
