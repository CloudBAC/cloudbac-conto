import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, tenantDelete, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'
import { populateCreatedBy } from '@/hooks/populateCreatedBy'
import { updateInvoicePaymentStatus } from '@/hooks/updateInvoicePaymentStatus'

export const InvoicePayments: CollectionConfig = {
  slug: 'invoice-payments',
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantDelete,
  },
  hooks: {
    beforeValidate: [populateOrganization],
    beforeChange: [populateCreatedBy],
    afterChange: [updateInvoicePaymentStatus],
    afterDelete: [updateInvoicePaymentStatus],
  },
  fields: [
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: 'invoices',
      required: true,
    },
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
    },
    {
      name: 'allocatedAmount',
      type: 'number',
      required: true,
      min: 0.01,
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
      admin: { readOnly: true },
    },
  ],
}
