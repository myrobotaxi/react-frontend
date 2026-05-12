# cryptox cross-implementation fixture

`cross-impl.json` is a fixed AES-256-GCM ciphertext, key, and plaintext
triple used by the cryptox unit tests on **both** implementations:

- **TS (this repo, react-frontend):** `__tests__/lib/cryptox/encryptor.test.ts`
  loads it and asserts `decryptString(ciphertext_b64)` round-trips to
  `plaintext` under `key_b64`.
- **Go (telemetry, Phase 2):**
  `internal/cryptox/testdata/cross-impl.json` will hold an
  identical-content copy with the same SHA256, exercising the same
  decrypt assertion.

Together these prove byte-equality of the cryptox wire format across
implementations without requiring deterministic-nonce hooks in the
encrypt path.

## Wire format under test

```
ciphertext blob = [1B version=0x01][12B nonce][N B ciphertext + 16B tag]
stored value    = base64(StdEncoding) of the blob
```

## Generation

The fixture was generated **once** by encrypting `plaintext` in the Go
implementation with a fresh random 32-byte key and the production
`cryptox.AesGcmEncryptor`. The generator script is intentionally NOT
checked in — regenerating would invalidate every test that pins to the
SHA256 below.

## Cross-repo coupling

If this fixture file changes, the Go-side copy MUST be updated in the
same coordinated rollout (Phase 1 TS / Phase 2 Go) and both PRs MUST
record the new SHA256.

**Current SHA256:**

```
409ccb4a0fd6bff1bd1d97691e9fd17fccbf7f7171561a8a1ebc61b012c7fa8e
```

(`shasum -a 256 cross-impl.json`)

The same SHA256 is recorded in the MYR-62 Phase 1 PR description and
must be pasted into the Phase 2 PR description in the telemetry repo.
