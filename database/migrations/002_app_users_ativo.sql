-- Status ativo/inativo dos usuários do painel e do portal.
-- Execute após 001_backoffice.sql, ex.:
--   mysql -u <usuario> -p triaige < database/migrations/002_app_users_ativo.sql

ALTER TABLE app_users
    ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER cargo;
