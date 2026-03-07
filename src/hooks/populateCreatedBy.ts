import type { CollectionBeforeChangeHook } from 'payload'

export const populateCreatedBy: CollectionBeforeChangeHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  if (req.user) {
    data.createdBy = req.user.id
  }

  return data
}
