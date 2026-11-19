import { Metadata } from 'next'
import ManualClient from './ManualClient'

export const metadata: Metadata = {
  title: 'Digital User Manual & Operational Help Center | ManoboLit Archive',
  description:
    'Complete step-by-step user manual and operational field guide for the ManoboLit Archive system with authentic screenshots, numbered instructions, and role-appropriate documentation.',
}

interface PageProps {
  searchParams?: {
    role?: string
  }
}

export default function ManualPage({ searchParams }: PageProps) {
  const role = searchParams?.role || 'all'
  return <ManualClient initialRole={role} />
}
