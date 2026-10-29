-- Cover the workbook import audit actor foreign key for admin audit lookups.
create index if not exists workbook_imports_imported_by_idx
  on public.workbook_imports(imported_by)
  where imported_by is not null;
