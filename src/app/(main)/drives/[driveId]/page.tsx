import { notFound } from 'next/navigation';

import { DriveSummaryScreen, getDriveById } from '@/features/drives';

/** Props passed by Next.js for dynamic route segments. */
interface DriveSummaryPageProps {
  params: Promise<{ driveId: string }>;
}

/**
 * Drive summary page — detailed view of a single drive.
 * Fetches drive by ID via server action. Returns 404 if not found or unauthorized.
 */
export default async function DriveSummaryPage({ params }: DriveSummaryPageProps) {
  const { driveId } = await params;
  const drive = await getDriveById(driveId);

  if (!drive) {
    notFound();
  }

  return <DriveSummaryScreen drive={drive} />;
}
