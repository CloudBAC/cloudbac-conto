'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@payloadcms/ui'

export default function BulkAddButton() {
  const router = useRouter()

  return (
    <Button
      size="small"
      buttonStyle="secondary"
      onClick={() => router.push('/admin/bulk-transactions')}
    >
      Bulk Add
    </Button>
  )
}
