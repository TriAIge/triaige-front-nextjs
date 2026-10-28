-- Dados de desenvolvimento para o schema compartilhado + migration 001_backoffice.
-- Rode uma vez num banco limpo (depois de canonical/schema.sql e 001_backoffice.sql):
--   mysql -u <usuario> -p triaige < database/seed-dev.sql
-- NÃO aplicar em produção.
--
-- Login (senha demo123):
--   demo@triaige.ai   -> admin (painel /admin)
--   portal@triaige.ai -> firm_user do "Escritório de Testes TriAIge" (portal /portal)
-- Credencial de API do escritório de testes (a mesma do seed do triaige-infra): dev-local-token

SET time_zone = '+00:00';

-- Escritório e credencial do seed canônico (INSERT IGNORE: o triaige-infra pode já ter criado).
INSERT IGNORE INTO law_firms (id, nome, cnpj, email_contato, telefone, status, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Escritório de Testes TriAIge', '00000000000100', 'contato@escritorio-teste.example.com', '+55 11 90000-0000', 'ACTIVE', NOW(6) - INTERVAL 30 DAY, NOW(6));
INSERT IGNORE INTO api_credentials (id, law_firm_id, name, token_hash, status, last_used_at, expires_at, created_at, updated_at) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Credencial de desenvolvimento local',
   'a8b209467de49495388ff13632517e447d243fb5d2f04534e4c2110047c141a2', 'ACTIVE', NULL, NULL, NOW(6) - INTERVAL 30 DAY, NOW(6));
UPDATE law_firms SET plano = 'Profissional', observacoes = 'Escritório usado nos testes locais do orchestrator.'
  WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO law_firms (id, nome, cnpj, email_contato, telefone, status, plano, observacoes, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Silva Pereira Jurídico', '98765432000110', 'juridico@silvapereira.com.br', '(21) 3030-1010', 'ACTIVE', 'Enterprise', 'Integração via API com CRM proprietário', NOW(6) - INTERVAL 60 DAY, NOW(6)),
  ('10000000-0000-0000-0000-000000000003', 'Costa & Lima Consultoria Legal', '11222333000144', 'contato@costalima.adv.br', '(51) 3500-2200', 'ONBOARDING', 'Starter', NULL, NOW(6) - INTERVAL 4 DAY, NOW(6));

INSERT INTO api_credentials (id, law_firm_id, name, token_hash, status, last_used_at, expires_at, created_at, updated_at, key_prefix) VALUES
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Integração CRM', SHA2('trg_demo_silva_key_not_shared', 256),
   'ACTIVE', NOW(6) - INTERVAL 3 HOUR, NOW(6) + INTERVAL 20 DAY, NOW(6) - INTERVAL 60 DAY, NOW(6), 'trg_demo_sil');

INSERT INTO app_users (id, nome, email, password_hash, role, law_firm_id, cargo, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Usuário Demo', 'demo@triaige.ai', '6fe9858de8989d7ea8e7ccb037f4ea0f:a690652a492db6a4393995de85c999c77b5f8aadb9b6b8814b6b41f7e40647990baa95a47ebe072430be27b51e9ee485a5570354ac6dd1b8b468e0b92cd2bf32', 'admin', NULL, 'Operações', NOW(6), NOW(6)),
  ('00000000-0000-0000-0000-000000000002', 'Ana Ribeiro', 'portal@triaige.ai', '6fe9858de8989d7ea8e7ccb037f4ea0f:a690652a492db6a4393995de85c999c77b5f8aadb9b6b8814b6b41f7e40647990baa95a47ebe072430be27b51e9ee485a5570354ac6dd1b8b468e0b92cd2bf32', 'firm_user', '11111111-1111-1111-1111-111111111111', 'Sócia', NOW(6), NOW(6));

INSERT INTO law_firm_contacts (id, law_firm_id, nome, email, telefone, canal_preferencial, ativo, created_at, updated_at) VALUES
  ('50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ana Ribeiro', 'ana.ribeiro@escritorio-teste.example.com', '(11) 99876-1234', 'EMAIL', 1, NOW(6), NOW(6)),
  ('50000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Paulo Andrade', 'paulo@escritorio-teste.example.com', '(11) 99123-8890', 'WHATSAPP', 1, NOW(6), NOW(6));

-- Sessões de triagem em estados variados.
INSERT INTO triage_sessions (id, law_firm_id, api_credential_id, protocolo, correlation_id, status, created_at, updated_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRI-2026-000101', 'c0000000-0000-0000-0000-000000000001', 'ANALYSIS_COMPLETED', NOW(6) - INTERVAL 2 HOUR, NOW(6) - INTERVAL 2 HOUR + INTERVAL 190 SECOND),
  ('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRI-2026-000102', 'c0000000-0000-0000-0000-000000000002', 'ANALYSIS_FAILED', NOW(6) - INTERVAL 26 HOUR, NOW(6) - INTERVAL 26 HOUR + INTERVAL 150 SECOND),
  ('20000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRI-2026-000103', 'c0000000-0000-0000-0000-000000000003', 'ANALYZING', NOW(6) - INTERVAL 20 MINUTE, NOW(6) - INTERVAL 20 MINUTE + INTERVAL 110 SECOND),
  ('20000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRI-2026-000104', 'c0000000-0000-0000-0000-000000000004', 'RECEIVING_DOCUMENTS', NOW(6) - INTERVAL 30 MINUTE, NOW(6) - INTERVAL 30 MINUTE),
  ('20000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRI-2026-000095', 'c0000000-0000-0000-0000-000000000005', 'ANALYSIS_COMPLETED', NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY + INTERVAL 190 SECOND),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'TRI-2026-000105', 'c0000000-0000-0000-0000-000000000006', 'QUEUED_FOR_PROCESSING', NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'TRI-2026-000099', 'c0000000-0000-0000-0000-000000000007', 'ANALYSIS_COMPLETED', NOW(6) - INTERVAL 30 HOUR, NOW(6) - INTERVAL 30 HOUR + INTERVAL 190 SECOND);

-- triage_sessions.protocolo é UNIQUE: o próximo protocolo gerado pelo orchestrator precisa vir depois dos do seed.
INSERT INTO protocol_sequences (year, last_sequence) VALUES (2026, 105)
  ON DUPLICATE KEY UPDATE last_sequence = GREATEST(last_sequence, 105);

INSERT INTO legal_cases (id, session_id, titulo, area_juridica, tipo_caso, created_at, updated_at)
SELECT CONCAT('21', SUBSTRING(id, 3)), id, t.titulo, t.area, t.tipo, created_at, created_at
FROM triage_sessions ts
JOIN (
  SELECT '20000000-0000-0000-0000-000000000001' AS sid, 'Reclamação trabalhista - rescisão indireta' AS titulo, 'Trabalhista' AS area, 'Rescisão indireta' AS tipo
  UNION ALL SELECT '20000000-0000-0000-0000-000000000002', 'Ação indenizatória por danos morais', 'Cível', 'Indenização'
  UNION ALL SELECT '20000000-0000-0000-0000-000000000003', 'Execução fiscal - CDA 2025', 'Tributário', 'Execução fiscal'
  UNION ALL SELECT '20000000-0000-0000-0000-000000000004', 'Notificação extrajudicial de cobrança', 'Consumidor', 'Cobrança indevida'
  UNION ALL SELECT '20000000-0000-0000-0000-000000000005', 'Revisão de contrato de prestação de serviços', 'Cível', 'Revisão contratual'
  UNION ALL SELECT '20000000-0000-0000-0000-000000000006', 'Contestação de fatura de telefonia', 'Consumidor', 'Cobrança indevida'
  UNION ALL SELECT '20000000-0000-0000-0000-000000000007', 'Due diligence contratual', 'Contratual', 'Due diligence'
) t ON t.sid = ts.id;

-- Documentos: retenção curta (1 dia) para o indicador de LGPD ter casos vencidos.
INSERT INTO legal_documents (id, session_id, attachment_group_id, part_number, nome_arquivo_original, tipo_documento, content_type, tamanho_bytes,
  raw_bucket, raw_object_key, raw_deleted_at, retention_expires_at, status, created_at, updated_at)
SELECT d.id, d.sid, CONCAT('31', SUBSTRING(d.id, 3)), 1, d.nome, d.tipo, d.ct, d.bytes,
  'bucket-triaige-raw-certificacoes', CONCAT(ts.law_firm_id, '/', ts.id, '/', d.id),
  CASE WHEN d.raw_deleted THEN ts.created_at + INTERVAL 12 HOUR END, ts.created_at + INTERVAL 1 DAY,
  d.status, ts.created_at, ts.created_at
FROM triage_sessions ts
JOIN (
  SELECT '30000000-0000-0000-0000-000000000001' AS id, '20000000-0000-0000-0000-000000000001' AS sid, 'Peticao_inicial.pdf' AS nome, 'PETICAO' AS tipo, 'application/pdf' AS ct, 482113 AS bytes, 'TRUSTED' AS status, FALSE AS raw_deleted
  UNION ALL SELECT '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Comprovante_admissao.jpg', 'COMPROVANTE', 'image/jpeg', 120443, 'TRUSTED', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Contrato_prestacao.pdf', 'CONTRATO', 'application/pdf', 310882, 'TRUSTED', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'CDA_2025.pdf', 'CDA', 'application/pdf', 98112, 'TRUSTED', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'Notificacao_extrajudicial.pdf', 'NOTIFICACAO', 'application/pdf', 70221, 'RECEIVED', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'Boleto_contestado.pdf', 'COMPROVANTE', 'application/pdf', NULL, 'PENDING_UPLOAD', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 'Contrato_social.pdf', 'CONTRATO', 'application/pdf', 254009, 'TRUSTED', TRUE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', 'Fatura_contestada.pdf', 'FATURA', 'application/pdf', 88120, 'OCR_IN_PROGRESS', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006', 'Print_conversa.png', 'PRINT', 'image/png', 45120, 'QUEUED', FALSE
  UNION ALL SELECT '30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000007', 'Minuta_contrato.docx', 'CONTRATO', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 61002, 'TRUSTED', TRUE
) d ON d.sid = ts.id;

-- Etapas do pipeline para as sessões que já passaram pelo mcp-ai.
-- Documento: document_upload, ocr, anonymization. Grupo: attachment_grouping, evidence_summarization. Sessão: session_finalize.
INSERT INTO processing_steps (id, session_id, document_id, attachment_group_id, step_name, status, started_at, finished_at, created_at, updated_at)
SELECT UUID(), d.session_id, d.id, d.attachment_group_id, s.step_name, 'COMPLETED',
  ts.created_at + INTERVAL s.start_s SECOND, ts.created_at + INTERVAL s.end_s SECOND,
  ts.created_at + INTERVAL s.start_s SECOND, ts.created_at + INTERVAL s.end_s SECOND
FROM legal_documents d
JOIN triage_sessions ts ON ts.id = d.session_id
JOIN (
  SELECT 'document_upload' AS step_name, 0 AS start_s, 2 AS end_s
  UNION ALL SELECT 'ocr', 3, 41
  UNION ALL SELECT 'anonymization', 41, 60
) s
WHERE ts.status IN ('ANALYZING', 'ANALYSIS_COMPLETED', 'ANALYSIS_FAILED');

INSERT INTO processing_steps (id, session_id, document_id, attachment_group_id, step_name, status, started_at, finished_at, created_at, updated_at)
SELECT UUID(), d.session_id, NULL, d.attachment_group_id, s.step_name, 'COMPLETED',
  ts.created_at + INTERVAL s.start_s SECOND, ts.created_at + INTERVAL s.end_s SECOND,
  ts.created_at + INTERVAL s.start_s SECOND, ts.created_at + INTERVAL s.end_s SECOND
FROM legal_documents d
JOIN triage_sessions ts ON ts.id = d.session_id
JOIN (
  SELECT 'attachment_grouping' AS step_name, 60 AS start_s, 66 AS end_s
  UNION ALL SELECT 'evidence_summarization', 66, 108
) s
WHERE ts.status IN ('ANALYZING', 'ANALYSIS_COMPLETED', 'ANALYSIS_FAILED');

INSERT INTO processing_steps (id, session_id, document_id, attachment_group_id, step_name, status, started_at, finished_at, created_at, updated_at)
SELECT UUID(), ts.id, NULL, NULL, 'session_finalize', 'COMPLETED',
  ts.created_at + INTERVAL 2 SECOND, ts.created_at + INTERVAL 3 SECOND, ts.created_at + INTERVAL 2 SECOND, ts.created_at + INTERVAL 3 SECOND
FROM triage_sessions ts
WHERE ts.status IN ('QUEUED_FOR_PROCESSING', 'ANALYZING', 'ANALYSIS_COMPLETED', 'ANALYSIS_FAILED');

-- Sessão na fila do mcp-ai (OCR em andamento) e sessão ainda recebendo documentos.
INSERT INTO processing_steps (id, session_id, document_id, attachment_group_id, step_name, status, started_at, finished_at, created_at, updated_at) VALUES
  (UUID(), '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000008', '31000000-0000-0000-0000-000000000008', 'document_upload', 'COMPLETED', NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR + INTERVAL 1 SECOND, NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR),
  (UUID(), '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000009', '31000000-0000-0000-0000-000000000009', 'document_upload', 'COMPLETED', NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR + INTERVAL 2 SECOND, NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR),
  (UUID(), '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000008', '31000000-0000-0000-0000-000000000008', 'ocr', 'IN_PROGRESS', NOW(6) - INTERVAL 3 HOUR + INTERVAL 5 SECOND, NULL, NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR),
  (UUID(), '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000009', '31000000-0000-0000-0000-000000000009', 'ocr', 'PENDING', NULL, NULL, NOW(6) - INTERVAL 3 HOUR, NOW(6) - INTERVAL 3 HOUR),
  (UUID(), '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', '31000000-0000-0000-0000-000000000005', 'document_upload', 'COMPLETED', NOW(6) - INTERVAL 30 MINUTE, NOW(6) - INTERVAL 30 MINUTE + INTERVAL 1 SECOND, NOW(6) - INTERVAL 30 MINUTE, NOW(6) - INTERVAL 30 MINUTE);

-- Resultados (relatório no S3 curated, chave <law_firm_id>/<session_id>/relatorio.json).
INSERT INTO triage_results (id, session_id, result_bucket, result_object_key, summary_object_key, jurisprudence_call_id, created_at, updated_at)
SELECT UUID(), ts.id, 'bucket-triaige-curated', CONCAT(ts.law_firm_id, '/', ts.id, '/relatorio.json'), CONCAT(ts.law_firm_id, '/', ts.id, '/relatorio.md'),
  NULL, ts.created_at + INTERVAL 190 SECOND, ts.created_at + INTERVAL 190 SECOND
FROM triage_sessions ts WHERE ts.status = 'ANALYSIS_COMPLETED';

-- Destinatários e entregas (serviço de notificação).
INSERT INTO notification_recipients (id, session_id, contact_id, nome, email, telefone, canal_preferencial) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Ana Ribeiro', 'ana.ribeiro@escritorio-teste.example.com', '(11) 99876-1234', 'EMAIL'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'Ana Ribeiro', 'ana.ribeiro@escritorio-teste.example.com', '(11) 99876-1234', 'EMAIL'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'Paulo Andrade', 'paulo@escritorio-teste.example.com', '(11) 99123-8890', 'WHATSAPP');

INSERT INTO notification_deliveries (id, session_id, recipient_id, canal, destino, status, provider, provider_message_id, error_message, sent_at, created_at, updated_at) VALUES
  ('41000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'EMAIL', 'ana.ribeiro@escritorio-teste.example.com', 'SENT', 'ses', 'msg-0001', NULL, NOW(6) - INTERVAL 2 HOUR + INTERVAL 200 SECOND, NOW(6) - INTERVAL 2 HOUR + INTERVAL 195 SECOND, NOW(6) - INTERVAL 2 HOUR + INTERVAL 200 SECOND),
  ('41000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'EMAIL', 'ana.ribeiro@escritorio-teste.example.com', 'SENT', 'ses', 'msg-0002', NULL, NOW(6) - INTERVAL 6 DAY + INTERVAL 200 SECOND, NOW(6) - INTERVAL 6 DAY + INTERVAL 195 SECOND, NOW(6) - INTERVAL 6 DAY + INTERVAL 200 SECOND),
  ('41000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'WHATSAPP', '(11) 99123-8890', 'FAILED', 'twilio', NULL, 'timeout', NULL, NOW(6) - INTERVAL 6 DAY + INTERVAL 195 SECOND, NOW(6) - INTERVAL 6 DAY + INTERVAL 230 SECOND);

-- Trilha do orchestrator (event_type do enum EventType).
INSERT INTO audit_events (id, session_id, law_firm_id, correlation_id, event_type, description, payload_json, created_at)
SELECT UUID(), ts.id, ts.law_firm_id, ts.correlation_id, e.event_type, e.description, NULL, ts.created_at + INTERVAL e.offset_s SECOND
FROM triage_sessions ts
JOIN (
  SELECT 'session_created' AS event_type, 'Sessão de triagem criada' AS description, 0 AS offset_s,
    'RECEIVING_DOCUMENTS,QUEUED_FOR_PROCESSING,ANALYZING,ANALYSIS_COMPLETED,ANALYSIS_FAILED' AS statuses
  UNION ALL SELECT 'document_uploaded', 'Upload de documento confirmado', 2,
    'RECEIVING_DOCUMENTS,QUEUED_FOR_PROCESSING,ANALYZING,ANALYSIS_COMPLETED,ANALYSIS_FAILED'
  UNION ALL SELECT 'session_finalized', 'Recebimento finalizado e publicado para processamento', 3,
    'QUEUED_FOR_PROCESSING,ANALYZING,ANALYSIS_COMPLETED,ANALYSIS_FAILED'
  UNION ALL SELECT 'mcp_result_received', 'Resultado do pipeline recebido: COMPLETED', 109, 'ANALYZING,ANALYSIS_COMPLETED,ANALYSIS_FAILED'
  UNION ALL SELECT 'ai_analysis_started', 'Disparando análise de IA (triaige-srv-mcp-ai)', 110, 'ANALYZING,ANALYSIS_COMPLETED,ANALYSIS_FAILED'
  UNION ALL SELECT 'ai_analysis_completed', 'Análise de IA concluída com sucesso', 190, 'ANALYSIS_COMPLETED'
  UNION ALL SELECT 'ai_analysis_failed', 'Falha na análise de IA: errorCode=MCP_AI_UNAVAILABLE', 150, 'ANALYSIS_FAILED'
) e ON FIND_IN_SET(ts.status, e.statuses) > 0;

INSERT INTO backoffice_audit_events (id, law_firm_id, actor, correlation_id, event_type, description, payload_json, created_at) VALUES
  (UUID(), '10000000-0000-0000-0000-000000000003', 'demo@triaige.ai', NULL, 'law_firm_created', 'Escritório cadastrado no painel.', NULL, NOW(6) - INTERVAL 4 DAY),
  (UUID(), '10000000-0000-0000-0000-000000000002', 'demo@triaige.ai', NULL, 'credential_created', 'Nova credencial de API emitida para o escritório.',
   JSON_OBJECT('credential_id', '60000000-0000-0000-0000-000000000002', 'prefix', 'trg_demo_sil'), NOW(6) - INTERVAL 60 DAY);
