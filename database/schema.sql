CREATE DATABASE IF NOT EXISTS triaige CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE triaige;

CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) NOT NULL PRIMARY KEY, name VARCHAR(180) NOT NULL, cnpj VARCHAR(18) NULL,
  contact_email VARCHAR(254) NULL, contact_phone VARCHAR(30) NULL,
  plan ENUM('Starter', 'Profissional', 'Enterprise') NOT NULL DEFAULT 'Starter', notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE KEY uq_companies_cnpj (cnpj),
  KEY idx_companies_name (name), KEY idx_companies_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS legal_cases (
  id CHAR(36) NOT NULL PRIMARY KEY, case_code VARCHAR(60) NOT NULL,
  status ENUM('recebido', 'em_validacao', 'em_processamento', 'relatorio_gerado', 'enviado', 'falha') NOT NULL DEFAULT 'recebido',
  channel ENUM('API', 'Web', 'WhatsApp', 'CRM') NOT NULL DEFAULT 'API', sender_registered BOOLEAN NOT NULL DEFAULT TRUE,
  plan ENUM('Starter', 'Profissional', 'Enterprise') NULL, deadline DATETIME(3) NULL, notes TEXT NULL,
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), company_id CHAR(36) NULL,
  UNIQUE KEY uq_legal_cases_case_code (case_code), KEY idx_legal_cases_company_id (company_id),
  KEY idx_legal_cases_status (status), KEY idx_legal_cases_submitted_at (submitted_at),
  CONSTRAINT fk_legal_cases_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY, name VARCHAR(150) NOT NULL, email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

INSERT INTO users (id, name, email, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001', 'Usuário Demo', 'demo@triaige.ai', '6fe9858de8989d7ea8e7ccb037f4ea0f:a690652a492db6a4393995de85c999c77b5f8aadb9b6b8814b6b41f7e40647990baa95a47ebe072430be27b51e9ee485a5570354ac6dd1b8b468e0b92cd2bf32')
ON DUPLICATE KEY UPDATE name = VALUES(name);
