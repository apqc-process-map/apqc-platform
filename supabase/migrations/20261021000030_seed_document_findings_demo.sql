-- DỮ LIỆU DEMO TAB 06: mẫu giả lập, KHÔNG PHẢI finding thực tế.
-- Gắn với quy trình thật trong APQC Platform; tạo tài liệu bản nháp metadata-only.
-- Idempotent by DEMO document_code and tagged finding title. No real document modified.
DO $seed$
DECLARE
  admins uuid[];
  owner_id uuid;
  ds record;
  fs record;
  ev record;
  act record;
  doc_id uuid;
  version_id uuid;
  process_id uuid;
  finding_id uuid;
  finding_new boolean;
  created_ids uuid[] := '{}'::uuid[];
  action_id uuid;
BEGIN
  select array_agg(id order by display_name) into admins from public.profiles where role='admin' and is_active=true;
  if coalesce(array_length(admins,1),0) < 3 then raise exception 'Need three active Admin accounts for demo assignments'; end if;
  owner_id := admins[1];
  if (select count(*) from public.processes where process_code between 'PROC-000011' and 'PROC-000020') <> 10 then
    raise exception 'Current 10 process catalog missing expected codes'; end if;

  for ds in select * from (values
  ('01', 'Hướng dẫn xác nhận đơn hàng tại cửa hàng', 'PROC-000013', 'execution', '2026-10-01', 'Mẫu giả định: xác nhận đơn tại POS sau khi thanh toán thành công.'),
  ('02', 'Quy trình xác nhận đơn bán hàng đa kênh', 'PROC-000017', 'execution', '2026-10-01', 'Mẫu giả định: xác nhận đơn tập trung sau khi hệ thống phân bổ tồn kho.'),
  ('03', 'Quy định mức tồn kho an toàn', 'PROC-000016', 'governance', '2026-10-01', 'Mẫu giả định: chốt ngưỡng tồn kho cho từng nhóm sản phẩm.'),
  ('04', 'Hướng dẫn đề nghị mua bổ sung tồn kho', 'PROC-000019', 'execution', '2026-10-01', 'Mẫu giả định: tạo đề nghị mua khi tồn kho về dưới ngưỡng.'),
  ('05', 'Quy trình xử lý giao hàng trễ', 'PROC-000012', 'execution', '2026-09-01', 'Mẫu giả định: nhóm giao hàng xử lý đơn chậm cam kết.'),
  ('06', 'Hướng dẫn phản hồi khiếu nại giao hàng trễ', 'PROC-000014', 'execution', '2026-09-01', 'Mẫu giả định: CSKH phản hồi sự cố giao trễ.'),
  ('07', 'Hướng dẫn hoàn tiền và đối soát giao dịch', 'PROC-000018', 'execution', '2026-08-01', 'Mẫu giả định: kế toán điều chỉnh đối soát hoàn tiền.'),
  ('08', 'Quy định điều chỉnh giao dịch đa kênh', 'PROC-000017', 'governance', '2026-08-01', 'Mẫu giả định: cập nhật số tiền đơn đa kênh.'),
  ('09', 'Thông báo thay đổi SLA giao hàng năm 2026', 'PROC-000012', 'communication', '2026-10-15', 'Mẫu giả định: lịch áp dụng SLA giao hàng mới.'),
  ('10', 'Phụ lục SLA giao hàng tại điểm bán', 'PROC-000017', 'governance', '2026-11-01', 'Mẫu giả định: lịch áp dụng SLA tại cửa hàng.'),
  ('11', 'Quy định phân bổ chỉ tiêu chiến lược', 'PROC-000015', 'governance', '2026-01-01', 'Mẫu giả định: mốc phê duyệt KPI và đơn vị chịu trách nhiệm.'),
  ('12', 'Hướng dẫn cascade KPI chuỗi giá trị bán lẻ', 'PROC-000011', 'execution', '2026-07-01', 'Mẫu giả định: mốc bàn giao KPI cho khối vận hành.'),
  ('13', 'Quy trình thẩm định nhà cung cấp mới', 'PROC-000019', 'execution', '2026-09-01', 'Mẫu giả định: nhà cung cấp phải được thẩm định trước PO đầu tiên.'),
  ('14', 'Hướng dẫn đưa sản phẩm mới vào danh mục bán', 'PROC-000020', 'execution', '2026-09-01', 'Mẫu giả định: danh mục sản phẩm phải được phê duyệt trước niêm yết.'),
  ('15', 'Chính sách đổi trả tại cửa hàng (dự thảo cũ)', 'PROC-000014', 'governance', '2026-06-01', 'Mẫu giả định: đổi trả tại cửa hàng trực tiếp.'),
  ('16', 'Chính sách đổi trả đa kênh (dự thảo mới)', 'PROC-000017', 'governance', '2026-10-01', 'Mẫu giả định: thay thế chính sách đổi trả cũ.')
  ) as s(key,title_vi,proc_code,group_code,start_date,summary_text) loop
    select id into doc_id from public.documents where document_code='DEMO-FND-DOC-'||ds.key;
    if doc_id is null then
      insert into public.documents(document_code,created_by)
        values ('DEMO-FND-DOC-'||ds.key, owner_id) returning id into doc_id;
    end if;
    select id into version_id from public.document_versions where document_id=doc_id and version_number=1;
    if version_id is null then
      insert into public.document_versions(document_id,version_number,status,title_vi,document_group,language,
        document_abstract,change_summary,created_by,valid_from,access_level)
      values(doc_id,1,'draft','[DEMO] '||ds.title_vi,ds.group_code,'vi',
        '[DEMO – TÌNH HUỐNG GIẢ LẬP] '||ds.summary_text||' Chỉ tạo metadata để thử tab 06, không có file thật.',
        'Dữ liệu minh họa về chồng chéo tài liệu, KHÔNG phải quy định hoặc issue thực tế.',owner_id,ds.start_date::date,'internal')
      returning id into version_id;
    end if;
    select id into process_id from public.processes where process_code=ds.proc_code;
    insert into public.document_process_links(document_version_id,process_id,link_role)
      values(version_id,process_id,'primary') on conflict do nothing;
  end loop;

  for fs in select * from (values
  ('F01', 'Trùng bước xác nhận đơn hàng giữa POS và bán đa kênh', 'exact_duplicate', 'high', 'high', 'new', 'required', '', 'PROC-000013 và PROC-000017: nhân viên thực hiện hai thao tác xác nhận, tăng thời gian xử lý và có nguy cơ lệch trạng thái đơn.', '2026-10-30', '', '0'),
  ('F02', 'Lặp quy định kích hoạt mua bổ sung giữa Tồn kho và Mua hàng', 'semantic_duplicate', 'medium', 'medium', 'triage', 'pending', '', 'Có thể có hai đầu mối kích hoạt đề nghị mua khiến số lượng đặt bổ sung bị tính hai lần.', '2026-11-05', '', '1'),
  ('F03', 'Chồng chéo trách nhiệm xử lý giao hàng trễ giữa Vận chuyển và CSKH', 'scope_overlap', 'high', 'urgent', 'in_progress', 'required', '', 'Khách hàng có thể được phản hồi khác nhau; thời gian xử lý khiếu nại kéo dài vì RACI chưa rõ.', '2026-10-18', '', '2'),
  ('F04', 'Mâu thuẫn thời hạn hoàn tiền giữa Bán hàng và Tài chính', 'potential_conflict', 'critical', 'high', 'in_progress', 'required', '', 'Có thể sai cam kết hoàn tiền và phát sinh chênh lệch đối soát nếu áp dụng hai thời hạn giả định khác nhau.', '2026-10-25', '', '1'),
  ('F05', 'Lệch mốc hiệu lực SLA giao hàng mới giữa hai kênh', 'effective_date_conflict', 'high', 'high', 'resolved', 'required', '', 'Dữ liệu DEMO cho thấy mốc 15/10 và 01/11 không đồng nhất; cần cơ chế chuyển tiếp rõ ràng.', '2026-10-19', '[DEMO] Đã bổ sung điều khoản chuyển tiếp và bảng ngày áp dụng chung; các action minh họa hoàn tất.', '0'),
  ('F06', 'Không đồng bộ phiên bản nguyên tắc cascade KPI chiến lược', 'version_conflict', 'medium', 'medium', 'closed', 'required', '', 'Có nguy cơ các khối lập kế hoạch theo bộ biểu mẫu KPI khác phiên bản, gây sai lệch trách nhiệm.', '2026-10-19', '[DEMO] Đã quy định phiên bản tham chiếu chuẩn và khóa sử dụng mẫu cũ trong ví dụ.', '2'),
  ('F07', 'Quan hệ phụ thuộc chưa rõ giữa phê duyệt NCC và đưa sản phẩm lên danh mục', 'relationship_conflict', 'medium', 'medium', 'pending_decision', 'pending', '', 'Chưa rõ điều kiện tiên quyết: phê duyệt NCC hay phê duyệt danh mục trước; có thể tạo vòng lặp công việc.', '2026-11-06', '', '1'),
  ('F08', 'Xem xét thay thế chính sách đổi trả tại cửa hàng bằng chính sách đa kênh', 'supersession_candidate', 'low', 'low', 'closed', 'not_required', '[DEMO] Hai dự thảo được xác định phục vụ giai đoạn chuyển tiếp, chưa phát sinh chồng lắp thực tế; chỉ cần ghi nhận lộ trình kế thừa.', 'Không tạo action khắc phục vì đây là ví dụ về quyết định không cần xử lý; giữ thông tin để tham chiếu.', '2026-11-12', '[DEMO] Kết luận không cần action; ghi nhận lý do và giữ theo dõi cho giai đoạn chuyển tiếp.', '0')
  ) as s(k,title_vi,type_code,severity,priority,target_status,action_decision,decision_reason,impact_summary,due_date,resolution_summary,assignee_index) loop
    select id into finding_id from public.findings where title='[DEMO 06/'||fs.k||'] '||fs.title_vi;
    finding_new := finding_id is null;
    if finding_new then
      insert into public.findings(title,description,finding_type_value_id,severity,priority,status,
        created_by,assignee_id,due_at,finding_domain,action_decision,action_decision_reason,impact_summary)
      values('[DEMO 06/'||fs.k||'] '||fs.title_vi,
        '[DEMO – KHÔNG PHẢI PHÁT HIỆN THỰC TẾ] Tình huống đối chiếu tài liệu giả lập được xây dựng trên các quy trình hiện tại. Mọi điều khoản và số liệu trong dẫn chứng đều là ví dụ.',
        (select x.id from public.vocabulary_values x join public.vocabularies v on v.id=x.vocabulary_id
          where v.code='finding_type' and x.code=fs.type_code),
        fs.severity::public.finding_severity,fs.priority::public.finding_priority,'new',
        owner_id,admins[fs.assignee_index::int+1],(fs.due_date::date + time '17:00') at time zone 'Asia/Ho_Chi_Minh',
        'document',fs.action_decision, nullif(fs.decision_reason,''),fs.impact_summary)
      returning id into finding_id;
      created_ids:=array_append(created_ids,finding_id);
    end if;

    if finding_new then
      for ev in select * from (values
  ('F01', '01', '[DEMO] Mục 3.1: nhân viên xác nhận đơn ngay khi thanh toán thành công tại POS.'),
  ('F01', '02', '[DEMO] Mục 2.4: bộ phận bán đa kênh xác nhận lại mọi đơn sau bước phân bổ hàng, kể cả đơn đã xác nhận tại POS.'),
  ('F02', '03', '[DEMO] Điều 5: tự tạo yêu cầu bổ sung hàng khi tồn kho dưới mức an toàn.'),
  ('F02', '04', '[DEMO] Bước 1.2: phòng mua hàng chủ động tạo yêu cầu mua khi tồn xuống ngưỡng đặt hàng, không đề cập yêu cầu đã tạo từ bộ phận tồn kho.'),
  ('F03', '05', '[DEMO] Mục 4.1: bộ phận giao hàng tự gọi khách và quyết định lịch giao lại.'),
  ('F03', '06', '[DEMO] Điều 3.3: CSKH là đầu mối duy nhất thỏa thuận lại thời gian giao với khách.'),
  ('F04', '07', '[DEMO] Bước 5: hoàn tiền trong 3 ngày làm việc kể từ biên bản đối soát.'),
  ('F04', '08', '[DEMO] Mục 6.2: hoàn tiền tối đa 7 ngày làm việc từ khi khách xác nhận yêu cầu.'),
  ('F05', '09', '[DEMO] Mục 2: SLA giao hàng mới dự kiến áp dụng từ 15/10/2026.'),
  ('F05', '10', '[DEMO] Phụ lục A: cửa hàng áp dụng SLA mới từ 01/11/2026, chưa nêu quy tắc cho đơn phát sinh 15–31/10.'),
  ('F06', '11', '[DEMO] Điều 7.1: phê duyệt KPI năm theo biểu mẫu phiên bản Q1/2026.'),
  ('F06', '12', '[DEMO] Phần II: áp dụng biểu mẫu phân rã KPI bản cập nhật Q3/2026, chưa nêu việc thay thế mẫu cũ.'),
  ('F07', '13', '[DEMO] Điều 4: NCC mới phải được phê duyệt trước khi mua hàng.'),
  ('F07', '14', '[DEMO] Mục 2.2: sản phẩm được phê duyệt dựa trên hồ sơ nhà cung cấp; chưa rõ có thể chạy song song bước xác minh NCC.'),
  ('F08', '15', '[DEMO] Mục 1: chỉ áp dụng đối với đơn mua trực tiếp tại cửa hàng, bản dự thảo trước.'),
  ('F08', '16', '[DEMO] Mục 1: mở rộng đổi trả đối với đơn đa kênh, có điều khoản chuyển tiếp cần người quản trị xác nhận.')
      ) as v(k,document_key,excerpt) where k=fs.k loop
        select dv.id into version_id from public.document_versions dv
          join public.documents d on d.id=dv.document_id
          where d.document_code='DEMO-FND-DOC-'||ev.document_key and dv.version_number=1;
        insert into public.finding_links(finding_id,object_type,object_id,link_role,evidence_excerpt)
        values(finding_id,'document_version',version_id,'subject',ev.excerpt) on conflict do nothing;
      end loop;
      -- Process context: these are real process map records; conflicts remain purely hypothetical.
      insert into public.finding_links(finding_id,object_type,object_id,link_role,evidence_excerpt)
      select distinct finding_id,'process_version',pv.id,'evidence',
        '[DEMO] Bối cảnh quy trình: '||p.process_code||' – '||pv.name_vi||'; không xác nhận xung đột thực tế.'
      from public.finding_links fl
        join public.document_process_links l on l.document_version_id=fl.object_id
        join public.processes p on p.id=l.process_id
        join lateral (select id,name_vi from public.process_versions where process_id=p.id order by version_number desc limit 1) pv on true
      where fl.finding_id=finding_id and fl.object_type='document_version'
      on conflict do nothing;
      for act in select * from (values
  ('F01', 'Chuẩn hóa một điểm xác nhận đơn hàng', 'Đưa ra bước xác nhận duy nhất cho POS và đa kênh.', '0', '2026-10-27', 'in_progress', '35', 'Đã phác thảo luồng xác nhận chung, đang xin ý kiến bán lẻ.', null),
  ('F01', 'Cập nhật hướng dẫn thao tác mPOS', 'Điều chỉnh hướng dẫn nhân viên cửa hàng theo luồng mới.', '1', '2026-11-02', 'todo', '0', null, null),
  ('F01', 'Kiểm thử đơn liên thông giữa các kênh', 'Thử đơn tại POS, web và kênh đối tác.', '2', '2026-11-04', 'todo', '0', null, null),
  ('F03', 'Thống nhất RACI khi đơn giao chậm', 'Chốt ai gọi khách, ai xác nhận lịch giao và ai đóng ticket.', '2', '2026-10-18', 'blocked', '20', 'Đang vướng chưa thống nhất quyền quyết định giữa giao hàng và CSKH.', null),
  ('F03', 'Cập nhật SOP và kịch bản phản hồi khách', 'Áp dụng một kịch bản liên bộ phận.', '1', '2026-10-26', 'in_progress', '60', 'Đã hoàn thành bản dự thảo, đang lấy phản hồi các bên.', null),
  ('F04', 'Đối soát lại mốc hoàn tiền thống nhất', 'Xác định mốc SLA áp dụng và thời điểm bắt đầu tính.', '1', '2026-10-28', 'in_progress', '70', 'Tài chính và bán hàng đã thống nhất sơ bộ mốc, còn chờ duyệt.', null),
  ('F04', 'Cập nhật thông báo khách và biểu mẫu hoàn tiền', 'Sửa các mẫu đang ghi hai SLA khác nhau.', '0', '2026-11-01', 'todo', '0', null, null),
  ('F05', 'Bổ sung quy định chuyển tiếp SLA giữa 2 mốc', 'Nêu rõ đơn đang xử lý từ ngày 15/10 đến 31/10.', '2', '2026-10-18', 'done', '100', 'Đã soạn phụ lục chuyển tiếp DEMO.', '[DEMO] Đã bổ sung bảng điều kiện chuyển tiếp; không có tài liệu thực tế được sửa.'),
  ('F05', 'Thống nhất lịch áp dụng trong hướng dẫn cửa hàng', 'Đồng bộ thời điểm áp dụng trên kênh vận hành.', '0', '2026-10-19', 'done', '100', 'Đã rà soát lịch DEMO.', '[DEMO] Lịch hiệu lực mới giả lập đã thống nhất trên 2 tài liệu.'),
  ('F06', 'Khóa phiên bản biểu mẫu KPI chuẩn', 'Rà soát và công bố một biểu mẫu cascade dùng thống nhất.', '1', '2026-10-18', 'done', '100', 'Đã đóng checklist DEMO.', '[DEMO] Đã đánh dấu biểu mẫu Q3 làm tham chiếu chuẩn trong kịch bản.')
      ) as a(k,title_vi,detail,assignee_index,due_date,action_status,progress,last_update,completion_evidence) where k=fs.k loop
        insert into public.finding_actions(finding_id,action_title,description,assignee_id,due_at,
          status,progress_percent,created_by)
        values(finding_id,'[DEMO] '||act.title_vi,act.detail,admins[act.assignee_index::int+1],
          act.due_date::date,'todo',0,owner_id) returning id into action_id;
        if act.action_status<>'todo' then
          update public.finding_actions set
            status=act.action_status,progress_percent=act.progress::int,
            last_update=nullif(act.last_update,''),completion_evidence=nullif(act.completion_evidence,'')
          where id=action_id;
        end if;
      end loop;
      if fs.target_status <> 'new' then
        update public.findings set status=fs.target_status::public.finding_status,
          resolution_summary=nullif(fs.resolution_summary,'')
        where id=finding_id;
      end if;
    end if;
  end loop;
  -- Suppress notifications generated by demo-only assignment/status changes.
  delete from public.notifications
  where object_type='finding' and object_id=any(created_ids);
END
$seed$;
