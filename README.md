# triAIge (Next.js + API Node.js)

LegalTech AI com front-end e API REST no mesmo projeto. A API usa os Route Handlers do Next.js no runtime Node.js e lê/escreve no **mesmo MySQL do `triaige-srv-orchestrator`**.

O orchestrator é o dono do fluxo de triagem: cria as sessões (`triage_sessions`), recebe documentos, grava etapas, eventos e o relatório da IA. Este projeto é o painel da equipe triAIge e o portal dos escritórios: lê esses dados e administra o que é de backoffice (escritórios, contatos, credenciais, usuários do painel).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Banco MySQL

O schema é o canônico do `triaige-infra`, compartilhado com o orchestrator (que roda com `ddl-auto: validate`). Não renomeie nem remova colunas dele.

| Arquivo | Conteúdo |
| --- | --- |
| `database/canonical/schema.sql` | Cópia do schema canônico (referência e ambiente local). |
| `database/migrations/001_backoffice.sql` | Tabelas do painel (`app_users`, `app_sessions`, `backoffice_audit_events`) e colunas opcionais (`law_firms.plano`, `law_firms.observacoes`, `api_credentials.key_prefix`). Só adiciona; o orchestrator ignora. |
| `database/seed-dev.sql` | Dados de demonstração (inclui o escritório `11111111-…` e a credencial `dev-local-token` do seed do orchestrator). |

Passos:

1. Copie `.env.example` para `.env.local` e preencha a conexão. `DB_NAME` (ou o banco em `DATABASE_URL`) precisa ser o mesmo do orchestrator.
2. Banco novo: execute `database/canonical/schema.sql`. Banco que o orchestrator já usa: pule este passo.
3. Execute `database/migrations/001_backoffice.sql` (uma vez).
4. Opcional: execute `database/seed-dev.sql`.
5. Inicie com `npm run dev`.

> A migration `001_backoffice.sql` também precisa entrar no `triaige-infra`, para que os ambientes compartilhados tenham as tabelas do painel.

Usuários do seed (senha `demo123`):

| Usuário | Perfil | Acesso |
| --- | --- | --- |
| `demo@triaige.ai` | `admin` | `/app` e `/admin` |
| `portal@triaige.ai` | `firm_user` (Escritório de Testes TriAIge) | `/portal` |

Todas as operações usam consultas preparadas (`?`). Senhas usam `scrypt`; sessões ficam em `app_sessions` e o navegador recebe apenas o cookie `triaige_session` (HttpOnly).

### O que este projeto grava no banco compartilhado

- `law_firms`: cadastro, edição e exclusão de escritórios (exclusão bloqueada quando há sessões de triagem; marque como inativo).
- `law_firm_contacts`: destinatários de relatório do portal.
- `api_credentials`: emissão (`token_hash` = SHA-256 hex do token, o mesmo que o orchestrator valida) e revogação (`REVOKED`).
- Tabelas da migration `001_backoffice.sql`.

Não grava em `triage_sessions`, `legal_cases`, `processing_steps`, `audit_events` nem nas demais tabelas do fluxo: os enums do orchestrator rejeitam valores desconhecidos. Ações do painel vão para `backoffice_audit_events`, e a tela de auditoria une os dois logs.

### Status dos casos

O status exibido é derivado de `triage_sessions.status`:

| `triage_sessions.status` | Status no painel |
| --- | --- |
| `RECEIVING_DOCUMENTS` | Recebido |
| `QUEUED_FOR_PROCESSING`, `COMPLETED`, `PARTIALLY_COMPLETED`, `ANALYZING` | Em processamento |
| `ANALYSIS_COMPLETED` | Relatório gerado, ou Enviado quando há entrega com sucesso em `notification_deliveries` |
| `FAILED`, `ANALYSIS_FAILED`, `CANCELLED` | Falha |

## Relatório da IA (S3)

O detalhe do caso no portal lê o `relatorio.json` gravado pelo orchestrator no bucket curated (`triage_results.result_bucket` / `result_object_key`) e mostra criticidade (`avaliacaoCriticidade.criticidade.nivel`), prazo fatal estimado (`controleDePrazos.prazoFatalEstimado`) e resumo executivo (`resumoExecutivo`). Área e tipo de caso vêm de `legal_cases` e, se vazios, do relatório.

- Credenciais pela cadeia padrão da AWS; região em `AWS_REGION`; `AWS_S3_ENDPOINT` para LocalStack (mesmo padrão do orchestrator).
- O JSON fica em cache em memória por 5 minutos (falhas, por 1 minuto).
- Sem relatório ou com erro no S3, os campos aparecem como "—" e o erro vai para o log do servidor.

## Perfis e acesso

- `admin` / `ops` (equipe triAIge): painel `/app` e `/admin`, endpoints `/api/clients`, `/api/cases` e `/api/admin/*`.
- `firm_user` (escritório cliente): `/portal` e `/api/portal/*`, sempre limitado ao escritório do usuário.
- O cadastro em `/login` cria um usuário `firm_user` e um escritório novo com status `ONBOARDING`.

## Páginas

- `/` — landing page
- `/login` — login e cadastro
- `/app/cases`, `/admin/cases` — acompanhamento das sessões de triagem (somente leitura)
- `/app/clients`, `/admin/clients` — CRUD de escritórios clientes
- `/admin/negocio` — indicadores de negócio
- `/admin/observabilidade` — saúde técnica
- `/admin/integracoes` — credenciais de API (emitir e revogar)
- `/admin/auditoria` — eventos do orchestrator e do painel
- `/admin/lgpd` — conformidade LGPD
- `/portal/cases`, `/portal/cases/[id]` — casos do escritório e detalhe
- `/portal/indicadores` — indicadores do escritório
- `/portal/config` — destinatários de relatório e credencial de API
- `/portal/auditoria` — auditoria do escritório

## Mock de dados

Com `NEXT_PUBLIC_USE_MOCK_DATA=true` no `.env.local`, todas as telas usam dados em memória e não exigem login. Reinicie o `npm run dev` após alterar a variável.

## Endpoints

### Autenticação

- `POST /api/auth/signin` — `{ email, password }`; grava o cookie de sessão
- `POST /api/auth/signup` — `{ name, email, password, company, job_title? }`
- `POST /api/auth/signout`
- `GET /api/auth/me` — usuário, perfil e escritório da sessão
- `GET /api/health` — conectividade com o banco

### Equipe triAIge (`admin`/`ops`)

- `GET/POST /api/clients`, `GET/PUT/PATCH/DELETE /api/clients/:id` (`DELETE` responde `409` se o escritório tiver sessões)
- `GET /api/cases`, `GET /api/cases/:id` — somente leitura
  - `GET /api/cases` aceita `status`, `company_id`, `area`, `q`, `page`, `limit` (total no header `X-Total-Count`)
- `GET /api/admin/metrics?period=7|30|90`
- `GET /api/admin/health?period=7|30|90` — campos do CloudWatch voltam `null`
- `GET /api/admin/credentials`, `POST /api/admin/credentials` (`{ company_id, name?, expires_at? }`; o token é exibido só na resposta), `POST /api/admin/credentials/:id/revoke`
- `GET /api/admin/audit` — `company_id`, `event_type`, `correlation_id`, `from`, `to`, `page`, `limit`
- `GET /api/admin/lgpd`

### Portal do escritório (`firm_user`)

- `GET /api/portal/cases` (`status`, `area`, `q`, `page`, `limit`), `GET /api/portal/cases/:id`
- `GET /api/portal/metrics?period=7|30|90`
- `GET/POST /api/portal/recipients`, `PATCH/DELETE /api/portal/recipients/:id`
- `GET /api/portal/credential`
- `GET /api/portal/audit`

### Ingestão

Não há ingestão neste projeto. Escritórios e integrações enviam documentos para a API do `triaige-srv-orchestrator`, autenticando com a credencial emitida em `/admin/integracoes` (`Authorization: Bearer <token>`).