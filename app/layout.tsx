import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "triAIge — Inteligência Jurídica para Operações em Escala",
  description:
    "Plataforma LegalTech com triagem por IA, leitura de documentos e predição de casos para escritórios e departamentos jurídicos.",
  authors: [{ name: "triAIge" }],
  openGraph: {
    title: "triAIge — Inteligência Jurídica para Operações em Escala",
    description:
      "Triagem autônoma, leitura de documentos e predição de casos via API LegalTech enterprise.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
