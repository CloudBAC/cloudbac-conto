import type { CollectionConfig } from 'payload'
import { tenantCreate, tenantIsolation, tenantDelete, isSuperAdmin } from '@/access'
import { populateOrganization } from '@/hooks/populateOrganization'
import { populateCreatedBy } from '@/hooks/populateCreatedBy'
import { computeInvoiceTotals } from '@/hooks/computeInvoiceTotals'
import { generateInvoiceNumber } from '@/hooks/generateInvoiceNumber'

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
  },
  access: {
    create: tenantCreate,
    read: tenantIsolation,
    update: tenantIsolation,
    delete: tenantDelete,
  },
  hooks: {
    beforeValidate: [populateOrganization],
    beforeChange: [
      populateCreatedBy,
      generateInvoiceNumber,
      computeInvoiceTotals,
    ],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'sales',
      options: [
        { label: 'Sales', value: 'sales' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Partially Paid', value: 'partially_paid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'party',
      type: 'relationship',
      relationTo: 'parties',
      required: true,
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
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
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      filterOptions: ({ data }) => ({
        organization: { equals: data?.organization },
      }),
    },
    {
      name: 'issueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'paymentTerms',
      type: 'select',
      defaultValue: 'net_30',
      options: [
        { label: 'Immediate', value: 'immediate' },
        { label: 'Net 15', value: 'net_15' },
        { label: 'Net 30', value: 'net_30' },
        { label: 'Net 60', value: 'net_60' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'lineItems',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0.01,
        },
        {
          name: 'rate',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'amount',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          name: 'taxType',
          type: 'relationship',
          relationTo: 'taxes',
          filterOptions: ({ data }) => ({
            organization: { equals: data?.organization },
          }),
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'taxes',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        {
          name: 'taxType',
          type: 'relationship',
          relationTo: 'taxes',
          required: true,
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
      name: 'totalAmount',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'paidAmount',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'balanceDue',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
}
