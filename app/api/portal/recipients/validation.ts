import type { JsonBody } from "@/lib/http";
import { RECIPIENT_CHANNELS, type PortalRecipientInput } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns the sanitized fields or an error message. With `partial`, absent fields are skipped. */
export function parseRecipient(body: JsonBody, partial: boolean): { data: Partial<PortalRecipientInput> } | { error: string } {
  const data: Partial<PortalRecipientInput> = {};
  const str = (key: string) => (typeof body[key] === "string" ? body[key].trim() : body[key] == null ? "" : String(body[key]).trim());
  if (!partial || "name" in body) {
    if (!str("name")) return { error: "O nome do destinatário é obrigatório." };
    data.name = str("name");
  }
  if (!partial || "email" in body) {
    if (str("email") && !EMAIL_RE.test(str("email"))) return { error: "E-mail inválido." };
    data.email = str("email").toLowerCase();
  }
  if (!partial || "phone" in body) data.phone = str("phone");
  if (!partial || "preferred_channel" in body) {
    if (!RECIPIENT_CHANNELS.includes(body.preferred_channel)) return { error: "Canal preferencial inválido." };
    data.preferred_channel = body.preferred_channel;
  }
  const email = data.email ?? (partial ? undefined : "");
  if (!partial && data.preferred_channel === "E-mail" && !email) return { error: "Informe o e-mail para o canal E-mail." };
  if (!partial && data.preferred_channel === "WhatsApp" && !data.phone) return { error: "Informe o telefone para o canal WhatsApp." };
  return { data };
}
