-- Normalize Vietnamese document-type display names without changing codes, IDs, groups or links.
-- Stable IDs keep all document_versions.document_type_value_id references valid.
UPDATE public.vocabulary_values AS value
SET label_vi = normalized.label_vi
FROM (VALUES
  ('form_template', 'Biểu mẫu'),
  ('checklist', 'Bảng kiểm'),
  ('guidance', 'Hướng dẫn sử dụng'),
  ('audit_report', 'Báo cáo đánh giá'),
  ('rca_report', 'Báo cáo phân tích nguyên nhân gốc rễ'),
  ('project_charter', 'Văn bản khởi tạo dự án'),
  ('business_case', 'Đề án kinh doanh'),
  ('external_reference', 'Tài liệu tham khảo ngoài doanh nghiệp'),
  ('other', 'Tài liệu khác')
) AS normalized(code,label_vi)
JOIN public.vocabularies AS vocabulary ON vocabulary.code='document_type'
WHERE value.vocabulary_id=vocabulary.id
  AND value.code=normalized.code
  AND value.label_vi IS DISTINCT FROM normalized.label_vi;
