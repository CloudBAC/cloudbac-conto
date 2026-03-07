import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'

export const Parties: CollectionConfig = {
  slug: 'parties',
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
      options: [
        { label: 'Individual', value: 'individual' },
        { label: 'Company', value: 'company' },
      ],
    },
    // Contact Person
    {
      type: 'row',
      fields: [
        {
          name: 'contactPersonName',
          label: 'Contact Person Name',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
        },
        {
          name: 'contactPersonEmail',
          label: 'Contact Person Email',
          type: 'email',
          admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
        },
        {
          name: 'contactPersonPhone',
          label: 'Contact Person Phone',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
        },
      ],
    },
    // Company Identifiers
    {
      type: 'row',
      fields: [
        {
          name: 'gstNumber',
          label: 'GST Number',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
        },
        {
          name: 'panNumber',
          label: 'PAN Number',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
        },
      ],
    },
    // Company Address
    {
      name: 'companyAddress',
      type: 'group',
      admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'state', type: 'text' },
            { name: 'pincode', type: 'text' },
          ],
        },
      ],
    },
    // Bank Details
    {
      name: 'bankDetails',
      label: 'Bank Details',
      type: 'group',
      admin: { condition: (_, siblingData) => siblingData?.type === 'company' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'accountNumber', label: 'Account Number', type: 'text' },
            { name: 'ifscCode', label: 'IFSC Code', type: 'text' },
            { name: 'bankName', label: 'Bank Name', type: 'text' },
          ],
        },
      ],
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
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
        type: { equals: 'party' },
      }),
    },
  ],
}
