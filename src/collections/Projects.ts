import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'
import { populateCreatedBy } from '@/hooks/populateCreatedBy'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantIsolation,
  },
  hooks: {
    beforeChange: [populateOrganization, populateCreatedBy],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: () => false,
      },
    },
  ],
}
