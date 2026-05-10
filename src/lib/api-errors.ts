/**
 * Shared error envelope for `/api/*` routes per `rest-api.md` §4.1.
 *
 * Imported by `DELETE /api/users/me` (MYR-72), `GET /api/users/me/export`
 * (MYR-75), and any future endpoint that returns the §4.1 envelope.
 */

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    subCode: string | null;
  };
}

export function errorEnvelope(
  code: string,
  message: string,
  subCode: string | null = null,
): ErrorEnvelope {
  return { error: { code, message, subCode } };
}
