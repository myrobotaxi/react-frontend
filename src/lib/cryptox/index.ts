/**
 * Public surface for the column-level encryption package. Mirrors the
 * Go-side `internal/cryptox` package shape so consumers in either
 * codebase reach for the same symbol names.
 *
 * Wire format and KeySet semantics MUST stay byte-equal across both
 * implementations — see `__fixtures__/cross-impl.json` for the proof
 * fixture.
 */

export type { Encryptor } from './encryptor';
export { AesGcmEncryptor, newEncryptor, VERSION_V1 } from './encryptor';

export {
  CryptoxError,
  ErrCiphertextTooShort,
  ErrInvalidKeyLength,
  ErrInvalidVersion,
  ErrUnknownKeyVersion,
  KeySet,
  loadKeySetFromEnv,
  KEY_LEN,
  NONCE_LEN,
  AES_GCM_TAG_LEN,
  MIN_CIPHERTEXT_LEN,
} from './key';
