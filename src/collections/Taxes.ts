import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'

export const Taxes: CollectionConfig = {
  slug: 'taxes',
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
      name: 'rate',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'description',
      type: 'textarea',
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
