import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'
import { tenantCreate, tenantIsolation, tenantDelete, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    components: {
      views: {
        list: {
          actions: ['/components/BulkAddButton', '/components/ImportExcelButton'],
        },
      },
    },
  },
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantDelete,
  },
  hooks: {
    beforeValidate: [
      populateOrganization,
      ({ data }) => {
        if (!data?.mainPartyFrom && !data?.mainPartyTo) {
          throw new ValidationError({
            errors: [
              {
                message: 'At least one of Main Party From or Main Party To is required',
                path: 'mainPartyFrom',
              },
            ],
          })
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const linkedPayments = await req.payload.find({
          collection: 'invoice-payments',
          where: { transaction: { equals: id } },
          depth: 0,
          limit: 1,
        })
        if (linkedPayments.totalDocs > 0) {
          throw new Error(
            'Cannot delete a transaction linked to invoices. Unlink the invoice payments first.',
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'date',
      type: 'date',
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
      custom: { 'plugin-import-export': { disabled: true } },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
      }),
    },
    {
      name: 'projectImpact',
      type: 'select',
      options: [
        { label: 'Debit', value: 'debit' },
        { label: 'Credit', value: 'credit' },
        { label: 'N/A', value: 'na' },
      ],
      defaultValue: 'na',
    },
    {
      name: 'fromParty',
      type: 'relationship',
      relationTo: ['parties', 'users'],
      required: true,
      filterOptions: ({ data, relationTo }) => {
        if (relationTo === 'users') {
          return { organization: { equals: data?.organization } }
        }
        return { organization: { equals: data?.organization } }
      },
    },
    {
      name: 'toParty',
      type: 'relationship',
      relationTo: ['parties', 'users'],
      required: true,
      filterOptions: ({ data, relationTo }) => {
        if (relationTo === 'users') {
          return { organization: { equals: data?.organization } }
        }
        return { organization: { equals: data?.organization } }
      },
    },
    {
      name: 'mainPartyFrom',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'mainPartyTo',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'transferType',
      type: 'select',
      required: true,
      options: [
        { label: 'Bank', value: 'bank' },
        { label: 'Liquid Cash', value: 'liquid_cash' },
        { label: 'Cheque', value: 'cheque' },
        { label: 'Crypto', value: 'crypto' },
      ],
    },
    {
      name: 'remarks',
      type: 'textarea',
    },
    {
      name: 'attachments',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      custom: { 'plugin-import-export': { disabled: true } },
    },
    {
      name: 'toBeReviewed',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
        type: { equals: 'transaction' },
      }),
    },
    {
      name: 'taxes',
      type: 'array',
      fields: [
        {
          name: 'taxType',
          type: 'relationship',
          relationTo: 'taxes',
          required: true,
          filterOptions: ({ data }) => ({
            organization: { equals: data?.organization },
          }),
        },
        {
          name: 'taxAmount',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      custom: { 'plugin-import-export': { disabled: true } },
    },
  ],
}
