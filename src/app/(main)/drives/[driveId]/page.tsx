import { DriveSummaryScreen } from '@/features/drives';
import { MOCK_DRIVES } from '@/lib/mock-data';

/** Props passed by Next.js for dynamic route segments. */
interface DriveSummaryPageProps {
  params: { driveId: string };
}

/**
 * Drive summary page — detailed view of a single drive.
 * Fetches drive by ID and passes to DriveSummaryScreen.
 */
export default function DriveSummaryPage({ params }: DriveSummaryPageProps) {
  const drive = MOCK_DRIVES.find((d) => d.id === params.driveId) ?? MOCK_DRIVES[0];

  return <DriveSummaryScreen drive={drive} />;
}
