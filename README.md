# triAIge (Next.js + API Node.js)

LegalTech AI com front-end e API REST no mesmo projeto. O backend usa os Route Handlers do Next.js no runtime Node.js e persiste os dados locais em `data/db.json`.

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

O armazenamento JSON e a autenticação demonstrativa são adequados para desenvolvimento local. Para produção, substitua-os por banco de dados, hash de senha, sessão segura e controle de acesso.
