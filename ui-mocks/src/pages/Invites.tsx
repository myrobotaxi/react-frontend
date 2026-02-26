import { useState } from 'react';
import { invites as mockInvites } from '../data/mockData.ts';

export function Invites() {
  const [emailInput, setEmailInput] = useState('');

  const activeViewers = mockInvites.filter((i) => i.status === 'accepted');
  const pendingInvites = mockInvites.filter((i) => i.status === 'pending');

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Header */}
      <header className="px-6 pt-16 pb-10">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Share Your Tesla</h1>
      </header>

      {/* Invite input */}
      <div className="px-6 mb-12">
        <div className="flex gap-3">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Email address"
            className="flex-1 bg-bg-surface border border-border-default rounded-xl py-4 px-5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/30 transition-colors"
          />
          <button className="bg-gold text-bg-primary font-semibold px-6 rounded-xl hover:bg-gold-light transition-colors text-sm whitespace-nowrap">
            Send Invite
          </button>
        </div>
      </div>

      {/* Active Viewers */}
      <div className="px-6 mb-10">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-5">
          Viewers · {activeViewers.length}
        </p>

        {activeViewers.length === 0 ? (
          <p className="text-text-muted text-sm font-light">No viewers yet</p>
        ) : (
          <div className="space-y-4">
            {activeViewers.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                    <span className="text-text-secondary font-medium text-sm">
                      {invite.label.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-primary ${
                      invite.isOnline ? 'bg-status-driving' : 'bg-text-muted'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-text-primary text-sm font-medium">{invite.label}</p>
                    <span className="text-text-muted text-[10px]">
                      {invite.permission === 'live+history' ? 'Full access' : 'Live only'}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs font-light">
                    {invite.isOnline ? 'Online now' : `Last seen ${invite.lastSeen}`}
                  </p>
                </div>

                {/* Revoke — subtle text button */}
                <button className="text-text-muted text-xs hover:text-text-secondary transition-colors">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      {pendingInvites.length > 0 && (
        <div className="px-6">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-5">
            Pending · {pendingInvites.length}
          </p>

          <div className="space-y-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                  <span className="text-text-muted font-medium text-sm">
                    {invite.label.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary text-sm font-medium">{invite.label}</p>
                  <p className="text-text-muted text-xs font-light">{invite.email}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="text-text-muted text-xs hover:text-text-secondary transition-colors">
                    Resend
                  </button>
                  <button className="text-text-muted text-xs hover:text-text-secondary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
