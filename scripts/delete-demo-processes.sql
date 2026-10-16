-- Run only when replacing the demo seed with real process data.
delete from public.processes where source_code like 'DEMO-20261016-%';
