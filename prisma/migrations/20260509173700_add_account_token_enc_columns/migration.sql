-- MYR-62 Phase 1 — encrypted shadows for OAuth tokens.
--
-- Adds three nullable TEXT columns to Account. Writes go to BOTH the
-- plaintext column and the matching *_enc column during the dual-write
-- rollout; reads prefer *_enc with plaintext fallback. The plaintext
-- columns will be dropped in a separate post-rollout migration.
--
-- Ciphertext format owned by lib/cryptox (TS) and internal/cryptox (Go):
--   [1B version=0x01][12B nonce][N B ct + 16B tag], base64(StdEncoding).
--
-- Additive only — no rewrite of existing rows.

ALTER TABLE "Account"
  ADD COLUMN "access_token_enc"  TEXT,
  ADD COLUMN "refresh_token_enc" TEXT,
  ADD COLUMN "id_token_enc"      TEXT;
