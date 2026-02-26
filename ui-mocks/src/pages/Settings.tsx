import { Link } from 'react-router-dom';

export function Settings() {
  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Header */}
      <header className="px-6 pt-16 pb-10">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Settings</h1>
      </header>

      {/* Profile */}
      <div className="px-6 mb-10">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Profile</p>
        <div className="space-y-1">
          <p className="text-text-primary text-base font-medium">Thomas Nandola</p>
          <p className="text-text-muted text-sm font-light">thomas@example.com</p>
        </div>
      </div>

      {/* Tesla Account */}
      <div className="px-6 mb-10">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-4">Tesla Account</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-status-driving" />
          <p className="text-text-primary text-sm font-light">
            Linked to Thomas's Model Y
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="px-6 mb-10">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-5">Notifications</p>
        <div className="space-y-5">
          {[
            { label: 'Drive started', enabled: true },
            { label: 'Drive completed', enabled: true },
            { label: 'Charging complete', enabled: false },
            { label: 'Viewer joined', enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-text-primary text-sm font-light">{item.label}</span>
              <div
                className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  item.enabled ? 'bg-gold' : 'bg-bg-elevated'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    item.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="px-6 mb-6">
        <Link
          to="/"
          className="text-text-muted text-sm font-light hover:text-text-secondary transition-colors"
        >
          Sign Out
        </Link>
      </div>

      {/* Version */}
      <div className="px-6">
        <p className="text-text-muted/50 text-xs font-light">MyRoboTaxi v1.0</p>
      </div>
    </div>
  );
}
