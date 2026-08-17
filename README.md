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
- `/app/cases` — rastreamento e CRUD de cases
- `/app/clients` — CRUD de escritórios clientes

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
