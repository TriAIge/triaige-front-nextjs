-- Migration aditiva do backoffice (front Next.js) sobre o schema compartilhado.
-- Execute uma vez no mesmo banco do triaige-srv-orchestrator, ex.:
--   mysql -u <usuario> -p triaige < database/migrations/001_backoffice.sql
-- Também precisa ser incluída no provisionamento do triaige-infra (Ansible).
-- Só cria tabelas novas e adiciona colunas anuláveis: compatível com ddl-auto=validate.

-- Usuários do painel (equipe triAIge) e do portal (escritórios).
CREATE TABLE IF NOT EXISTS app_users (
    id              CHAR(36)     NOT NULL,
    nome            VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    law_firm_id     CHAR(36),
    cargo           VARCHAR(120),
    ativo           TINYINT(1)   NOT NULL DEFAULT 1,
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_app_users_email (email),
    INDEX idx_app_users_law_firm_id (law_firm_id),
    CONSTRAINT fk_app_users_law_firm FOREIGN KEY (law_firm_id)
        REFERENCES law_firms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Sessões de login do painel/portal (cookie HttpOnly; aqui só o SHA-256 do token).
CREATE TABLE IF NOT EXISTS app_sessions (
    token_hash      CHAR(64)     NOT NULL,
    user_id         CHAR(36)     NOT NULL,
    expires_at      DATETIME(6)  NOT NULL,
    created_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (token_hash),
    INDEX idx_app_sessions_user_id (user_id),
    INDEX idx_app_sessions_expires_at (expires_at),
    CONSTRAINT fk_app_sessions_user FOREIGN KEY (user_id)
        REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Ações do backoffice (cadastro de escritório, credenciais, incidentes). Fica separada de
-- audit_events porque o orchestrator converte event_type com um enum fechado.
CREATE TABLE IF NOT EXISTS backoffice_audit_events (
    id              CHAR(36)     NOT NULL,
    law_firm_id     CHAR(36),
    actor           VARCHAR(200),
    correlation_id  CHAR(36),
    event_type      VARCHAR(50)  NOT NULL,
    description     VARCHAR(500) NOT NULL,
    payload_json    TEXT,
    created_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_backoffice_audit_law_firm_id (law_firm_id),
    INDEX idx_backoffice_audit_event_type (event_type),
    INDEX idx_backoffice_audit_created_at (created_at),
    CONSTRAINT fk_backoffice_audit_law_firm FOREIGN KEY (law_firm_id)
        REFERENCES law_firms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE law_firms
    ADD COLUMN plano        VARCHAR(30)   NULL,
    ADD COLUMN observacoes  VARCHAR(1000) NULL;

-- Início da chave emitida pelo painel (ex.: "trg_live_abc"), só para exibição.
ALTER TABLE api_credentials
    ADD COLUMN key_prefix   VARCHAR(16)   NULL;
