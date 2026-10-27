-- Production-readiness for the controlled installment-document import.
-- Legacy Word files remain private Storage objects; only authenticated users can read them.
alter table public.document_files drop constraint if exists document_files_mime_type_check;
alter table public.document_files add constraint document_files_mime_type_check check(mime_type in (
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png','image/jpeg'
));

update storage.buckets
set allowed_mime_types=array[
  'application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png','image/jpeg'
]
where id='process-documents';
