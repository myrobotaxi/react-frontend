/**
 * Feature-specific types for the invites domain.
 * Cross-feature types live in @/types/. These are internal to the invites feature.
 */

/** Form data for creating a new invite. */
export interface InviteFormData {
  label: string;
  email: string;
  permission: 'live' | 'live+history';
}
