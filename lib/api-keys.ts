import { createHash, randomBytes } from "node:crypto";

export const generateApiKey = () => `trg_live_${randomBytes(24).toString("base64url")}`;
/** Same hash the orchestrator checks in `api_credentials.token_hash`: SHA-256 hex of the full token. */
export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");
