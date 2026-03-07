'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@payloadcms/ui'

export default function ImportExcelButton() {
  const router = useRouter()

  return (
    <Button
      size="small"
      buttonStyle="secondary"
      onClick={() => router.push('/admin/import-transactions')}
    >
      Import Excel
    </Button>
  )
}
