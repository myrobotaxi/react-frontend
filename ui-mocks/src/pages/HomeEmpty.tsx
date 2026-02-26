import { useNavigate } from 'react-router-dom';

export function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-primary to-bg-surface opacity-50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/[0.03] blur-3xl" />

      <div className="relative z-10 text-center max-w-sm animate-fade-in">
        {/* Car icon — line art in gold */}
        <div className="mb-12">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
            {/* Car body outline */}
            <path
              d="M16 48h48M16 48c-2 0-4-2-4-4v-6c0-2 1.5-3.5 3-4l8-12c1.5-2.5 3-4 6-4h22c3 0 4.5 1.5 6 4l8 12c1.5.5 3 2 3 4v6c0 2-2 4-4 4"
              stroke="#C9A84C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Windshield */}
            <path
              d="M26 22l-6 16h40l-6-16"
              stroke="#C9A84C"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.5"
            />
            {/* Left wheel */}
            <circle cx="24" cy="48" r="5" stroke="#C9A84C" strokeWidth="1.5" />
            <circle cx="24" cy="48" r="2" fill="#C9A84C" opacity="0.3" />
            {/* Right wheel */}
            <circle cx="56" cy="48" r="5" stroke="#C9A84C" strokeWidth="1.5" />
            <circle cx="56" cy="48" r="2" fill="#C9A84C" opacity="0.3" />
            {/* Headlight hint */}
            <circle cx="14" cy="40" r="1.5" fill="#C9A84C" opacity="0.4" />
            <circle cx="66" cy="40" r="1.5" fill="#C9A84C" opacity="0.4" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-4">
          Welcome to MyRoboTaxi
        </h1>

        {/* Subtext */}
        <p className="text-text-secondary text-base font-light leading-relaxed mb-14">
          Get started by adding your Tesla or joining a friend's car.
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Primary CTA — gold filled */}
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-gold text-bg-primary font-semibold py-4 px-6 rounded-xl hover:bg-gold-light transition-colors text-base"
          >
            Add Your Tesla
          </button>

          {/* Secondary — outlined */}
          <button
            onClick={() => navigate('/home')}
            className="w-full border border-border-default text-text-primary font-medium py-4 px-6 rounded-xl hover:bg-bg-surface transition-colors text-base"
          >
            Enter Invite Code
          </button>
        </div>
      </div>
    </div>
  );
}
