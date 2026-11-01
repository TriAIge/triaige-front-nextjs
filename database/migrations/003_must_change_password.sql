-- Força redefinição de senha no primeiro acesso (senha provisória gerada pela equipe triAIge).
-- Execute após 002_app_users_ativo.sql, ex.:
--   mysql -u <usuario> -p triaige < database/migrations/003_must_change_password.sql

ALTER TABLE app_users
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER ativo;
