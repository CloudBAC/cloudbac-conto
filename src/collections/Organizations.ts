import type { CollectionConfig } from 'payload'
import { tenantCreateOrg, tenantUpdateOrg, tenantDelete, tenantIsolationOrgs } from '@/access'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: tenantCreateOrg,
    read: tenantIsolationOrgs,
    update: tenantUpdateOrg,
    delete: tenantDelete,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const children = await req.payload.find({
          collection: 'organizations',
          where: { parent: { equals: id } },
          depth: 0,
          limit: 1,
        })
        if (children.totalDocs > 0) {
          throw new Error(
            'Cannot delete organization with child organizations. Remove children first.',
          )
        }

        const users = await req.payload.find({
          collection: 'users',
          where: { organization: { equals: id } },
          depth: 0,
          limit: 1,
        })
        if (users.totalDocs > 0) {
          throw new Error(
            'Cannot delete organization with assigned users. Reassign or remove users first.',
          )
        }

        const collections = ['projects', 'parties', 'transactions', 'media'] as const
        for (const collection of collections) {
          const result = await req.payload.find({
            collection,
            where: { organization: { equals: id } },
            depth: 0,
            limit: 1,
          })
          if (result.totalDocs > 0) {
            throw new Error(
              `Cannot delete organization with existing ${collection}. Remove related data first.`,
            )
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'organizations',
      maxDepth: 1,
    },
  ],
}
