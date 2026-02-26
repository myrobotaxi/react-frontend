/** Permission levels for shared viewers. */
export type InvitePermission = 'live' | 'live+history';

/** Invite status in the lifecycle. */
export type InviteStatus = 'pending' | 'accepted';

/** An invitation to share vehicle access with another user. */
export interface Invite {
  id: string;
  label: string;
  email: string;
  status: InviteStatus;
  permission: InvitePermission;
  sentDate: string;
  acceptedDate?: string;
  lastSeen?: string;
  isOnline?: boolean;
}
