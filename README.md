# triAIge (Next.js + API Node.js)

LegalTech AI com front-end e API REST no mesmo projeto. O backend usa os Route Handlers do Next.js no runtime Node.js e persiste os dados no MySQL.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Páginas

- `/` — landing page
- `/login` — login e cadastro conectados à API (demo: `demo@triaige.ai` / `demo123`)
- `/app/cases` — visão geral / rastreamento e CRUD de cases
- `/app/clients` — CRUD de escritórios clientes
- `/admin` — redireciona para `/admin/cases`
- `/admin/cases` — visão geral / cases (mesmo fluxo de `/app/cases`, no shell admin)
- `/admin/clients` — escritórios (mesmo fluxo de `/app/clients`, no shell admin)
- `/admin/negocio` — indicadores de negócio (charts)
- `/admin/observabilidade` — saúde técnica
- `/admin/integracoes` — credenciais de API
- `/admin/auditoria` — logs e auditoria
- `/admin/lgpd` — conformidade LGPD
- `/portal` — redireciona para `/portal/cases`
- `/portal/cases` — meus casos (visão do escritório)
- `/portal/cases/[id]` — detalhe do caso (timeline, docs, entrega)
- `/portal/indicadores` — indicadores & produtividade do escritório
- `/portal/config` — canais, destinatários e credencial de API
- `/portal/auditoria` — auditoria do escritório (sem detalhe técnico interno)

## Mock de dados

Defina no `.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

- `true` — cases, clients e todas as telas admin usam dados mock em memória (CRUD mock incluso).
- `false` — cases/clients usam a API MySQL; seções admin ainda sem backend ficam vazias ou indisponíveis.

Reinicie o `npm run dev` após alterar a variável.

## Endpoints

- `GET/POST /api/clients`
- `GET/PUT/PATCH/DELETE /api/clients/:id`
- `GET/POST /api/cases`
- `GET/PUT/PATCH/DELETE /api/cases/:id`
- `POST /api/auth/signin`
- `POST /api/auth/signup`
- `GET /api/health`

## Banco MySQL

1. Copie `.env.example` para `.env.local` e preencha a conexão recebida.
2. Execute `database/schema.sql` no servidor MySQL.
3. Inicie com `npm run dev`.

Todas as operações usam consultas preparadas (`?`) no backend. As senhas são armazenadas com `scrypt`; para produção, ainda é recomendado complementar a autenticação com cookies de sessão `HttpOnly` e controle de acesso.
