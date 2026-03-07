import type { CollectionConfig } from 'payload'
import { isAuthenticated, tenantIsolation, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: tenantIsolation,
    delete: tenantIsolation,
  },
  hooks: {
    beforeChange: [populateOrganization],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      access: {
        update: isSuperAdmin,
      },
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
