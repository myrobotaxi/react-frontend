'use client';

/**
 * Main app layout — wraps all authenticated pages.
 * Provides the BottomNav shell and auth gate.
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {children}
      {/* BottomNav will be added here */}
    </div>
  );
}
