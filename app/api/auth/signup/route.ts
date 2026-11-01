import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

/** Public self-signup is disabled. Staff create portal users via POST /api/clients/:id/users. */
export async function POST() {
  return jsonError("O cadastro público está desativado. Solicite o acesso à equipe triAIge.", 403);
}
