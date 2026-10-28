-- Import the 34 source rows classified as "Quy Trình" in Process Map.xlsx.
-- The workbook itself stays outside Git. Unknown process content remains blank and mappings stay proposed.
create temporary table imported_process_map (
  process_code text primary key,
  name_vi text not null,
  drafting_department text not null,
  drafting_unit text not null,
  valid_from date not null,
  source_review_count integer not null,
  apqc_l0_hierarchy text not null,
  apqc_l1_hierarchy text not null,
  display_order integer not null
) on commit drop;

insert into imported_process_map values
('PNJ-QT-PDBPTNC-CCU-DBBH', 'QUY TRÌNH DỰ BÁO BÁN HÀNG', 'Phòng Dự Báo & Phân Tích Nhu Cầu (Khối Cung Ứng)', 'Khối Cung ứng', '2021-04-02', 2, '4.0', '4.1', 10),
('PNJ-QT- KKHBL-Z- CPTSPK', 'QUY TRÌNH CẤP PHÁT  TRANG SỨC - PHỤ KIỆN STYLE BY PNJ', 'Khối Khách Hàng và Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2020-12-16', 0, '4.0', '4.4', 20),
('PNJ-QT- PTNKHVNLBL-XLDGVOC', 'QUY TRÌNH XỬ LÝ ĐÁNH GIÁ VOC', 'Phòng Trải Nghiệm Khách Hàng và Năng Lực Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2025-01-10', 1, '6.0', '6.5', 30),
('PNJ-QT- PTTTM-TT- TKCTTQ', 'QUY TRÌNH TRIỂN KHAI CHƯƠNG TRÌNH  RETAIL MARKETING TOÀN QUỐC', 'Phòng Tiếp Thị Bán Lẻ (Khối Khách Hàng và Bán Lẻ)', 'Khối Khách Hàng và Bán Lẻ', '2021-12-15', 0, '3.0', '3.4', 40),
('PNJ-QT-KBL-BAN- ĐĐHTYC', 'OTC-110 - QUY TRÌNH ĐƠN ĐẶT HÀNG THEO YÊU CẦU', 'Khối Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2019-03-29', 0, '3.0', '3.5', 50),
('PNJ-QT-KBL-Z-KSHĐVCTCQL', 'QUY TRÌNH KIỂM SOÁT HOẠT ĐỘNG VÀ CHẾ TÀI CẤP QUẢN LÝ', 'Khối Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2020-10-01', 0, '7.0', '7.4', 60),
('PNJ-QT-P.VHBL-TTĐHTCH', 'QUY TRÌNH TRUYỀN THÔNG ĐẾN HỆ THỐNG CỬA HÀNG', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2024-07-07', 0, '13.0', '13.6', 70),
('PNJ-QT-PBHĐK- TS - XLMH', 'QUY TRÌNH XỬ LÝ MẤT HÀNG TRONG HOẠT ĐỘNG BÁN HÀNG ĐA KÊNH', 'Phòng Bán Hàng Đa Kênh', 'Khối Khách Hàng và Bán Lẻ', '2020-09-06', 0, '4.0', '4.4', 80),
('PNJ-QT-PKHCSBL-CTTĐPHNHBPCTTTCTLK', 'QUY TRÌNH CHƯƠNG TRÌNH THI ĐUA PHỐI HỢP NHÃN HÀNG BỘ PHẬN CÔNG TY THÀNH VIÊN VÀ CÔNG TY LIÊN KẾT', 'Phòng Kế Hoạch và Chính Sách Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2024-01-27', 0, '3.0', '3.5', 90),
('PNJ-QT-PKHCSBL-PHTCCTTĐCN', 'QUY TRÌNH PHỐI HỢP TỔ CHỨC CHƯƠNG TRÌNH THI ĐUA CHI NHÁNH', 'Phòng Kế Hoạch và Chính Sách Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2025-06-18', 0, '3.0', '3.5', 100),
('PNJ-QT-PKHVCSBL-ĐTCTDTCN', 'QUY TRÌNH ĐIỀU TIẾT CHỈ TIÊU DOANH THU CHI NHÁNH', 'Phòng Kế Hoạch và Chính Sách Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2024-12-29', 0, '3.0', '3.5', 110),
('PNJ-QT-PQHKH-Z-TNCG', 'QUY TRÌNH TIẾP NHẬN CUỘC GỌI QUA HOTLINE', 'Phòng Trải Nghiệm Khách Hàng và Năng Lực Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2020-03-30', 0, '6.0', '6.2', 120),
('PNJ-QT-PTTBL-PHQLMVPUĐ', 'QUY TRÌNH PHÁT HÀNH QUẢN LÝ MÃ VÀ PHIẾU ƯU ĐÃI', 'Phòng Tiếp Thị Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2023-12-16', 2, '3.0', '3.5', 130),
('PNJ-QT-PTTTM-TT-TKCTCN', 'QUY TRÌNH PHỐI HỢP TRIỂN KHAI CHƯƠNG TRÌNH RETAIL MARKETING CHI NHÁNH', 'Phòng Tiếp Thị Bán Lẻ (Khối Khách Hàng và Bán Lẻ)', 'Khối Khách Hàng và Bán Lẻ', '2021-07-12', 0, '3.0', '3.5', 140),
('PNJ-QT-PVHBL-BHTTTCH', 'QUY TRÌNH BÁN HÀNG TRỰC TIẾP TẠI CỬA HÀNG', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2026-01-19', 10, '3.0', '3.5', 150),
('PNJ-QT-PVHBL-CSNNTHATCH', 'QUY TRÌNH CHĂM SÓC NỘI NGOẠI THẤT VÀ HÌNH ẢNH TẠI CỬA HÀNG', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2023-03-08', 4, '10.0', '10.3', 160),
('PNJ-QT-PVHBL-ĐGVH', 'QUY TRÌNH ĐÁNH GIÁ VẬN HÀNH', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2023-01-09', 6, '13.0', '13.3', 170),
('PNJ-QT-PVHBL-ĐHMĐ', 'QUY TRÌNH ĐƠN HÀNG MAY ĐO', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2023-10-07', 0, '3.0', '3.5', 180),
('PNJ-QT-PVHBL-THĐHĐC', 'QUY TRÌNH THỰC HIỆN ĐƠN HÀNG ĐẶT CỌC', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2026-11-09', 2, '3.0', '3.5', 190),
('PNJ-QT-PVHBL-TLCĐCH', 'QUY TRÌNH THÀNH LẬP CHUYỂN ĐỔI CỬA HÀNG', 'Phòng Vận Hành Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2023-05-06', 2, '10.0', '10.1', 200),
('PNJ-QT-VPBL-BH-BHTG', 'QUY TRÌNH BÁN HÀNG TRẢ GÓP', 'Khối Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2018-03-07', 0, '3.0', '3.5', 210),
('PNJ-R-PQTHQ-NKDCDDB', 'QUI TRÌNH  NGƯNG HOẠT ĐỘNG KINH DOANH/ CHUYỂN ĐỔI ĐIỂM BÁN/ CHI NHÁNH', 'Khối Khách Hàng và Bán Lẻ', 'Khối Khách Hàng và Bán Lẻ', '2016-11-01', 0, '10.0', '10.4', 220),
('PNJ-QT-P.QLNH-PHTKMM', 'QUY TRÌNH PHỐI HỢP TRIỂN KHAI MẪU MỚI', 'Phòng Quản Lý Nhãn Hàng', 'Khối Marketing', '2024-10-05', 3, '2.0', '2.3', 230),
('PNJ-QT-PQLNH-NCKSTT', 'QUY TRÌNH NGHIÊN CỨU KHẢO SÁT THỊ TRƯỜNG', 'Phòng Quản Lý Nhãn Hàng', 'Khối Marketing', '2023-06-26', 3, '1.0', '1.1', 240),
('PNJ-QT-PTTKDTT-MMSP-BTSP', 'QUY TRÌNH BIÊN TẬP SẢN PHẨM - PNJ-QT-PTTKDTT-MMSP-BTSP.doc', 'Phòng Tiếp Thị Trực Tuyến (Khối Marketing)', 'Khối Marketing', '2016-12-30', 0, '2.0', '2.3', 250),
('PNJ-QT-PTTKDTT-TT-PHTKCTTTD', 'QUY TRÌNH PHỐI HỢP TRIỂN KHAI CHƯƠNG TRÌNH DIGITAL MARKETING - PNJ-QT-PTTKDTT-TT-PHTKCTTTD.doc', 'Khối Marketing', 'Khối Marketing', '2018-12-27', 1, '12.0', '12.5', 260),
('PNJ-QT-PTTTTTH-CTMAR-CHVXLA', 'QUY TRÌNH CHỤP HÌNH VÀ XỬ LÝ ẢNH', 'Phòng Truyền Thông Tiếp Thị Tích Hợp (Khối Marketing)', 'Khối Marketing', '2018-08-11', 1, '2.0', '2.3', 270),
('PNJ-QT-PTTTTTH-CTMAR-TKĐH', 'QUY TRÌNH THIẾT KẾ ĐỒ HỌA', 'Phòng Truyền Thông Tiếp Thị Tích Hợp (Khối Marketing)', 'Khối Marketing', '2018-08-30', 0, '2.0', '2.3', 280),
('PNJ-R-PQTHQ-TCHCTL', 'QUY TRÌNH  TỔ CHỨC HỘI CHỢ - TRIỄN LÃM - PNJ-R-PQTHQ-TCHCTL.doc', 'Khối Marketing', 'Khối Marketing', '2016-06-22', 0, '3.0', '3.5', 290),
('PNJ-R-PTT-CHXLA', 'Quy trình chụp hình và xử lý ảnh - PNJ-R-PTT-CHXLA.doc', 'Khối Marketing', 'Khối Marketing', '2015-06-08', 0, '2.0', '2.3', 300),
('PNJ-QT-PKT-CCU-LCQLPQT', 'QUY TRÌNH LUÂN CHUYỂN, QUẢN LÝ PHIẾU QUÀ TẶNG - PNJ-QT-PKT-CCU-LCQLPQT.docx', 'Phòng Kế Toán (Khối Tài Chính Vận Hành)', 'Khối Tài chính', '2017-08-05', 2, '3.0', '3.5', 310),
('PNJ-QT-PTC-Z-PBCPBHVQLVC', 'RTR 680 THIẾT LẬP QUY TRÌNH PHÂN BỔ CHI PHÍ BÁN HÀNG VÀ QUẢN LÝ VỀ COPA', 'Khối Tài Chính Vận Hành', 'Khối tài chính', '2019-01-04', 0, '3.0', '3.4', 320),
('PNJ-QT-PNCTT-BAN-THMHTC', 'QUY TRÌNH  THỰC HIỆN MÔ HÌNH TÀI CHÍNH', 'Khối Khách Hàng và Bán Lẻ', 'Tổng Giám Đốc Công Ty PNJ', '2016-06-12', 0, '9.0', '9.1', 330),
('PNJ-QT-PTHT-TKVM', 'QUY TRÌNH THIẾT KẾ VISUAL MERCHANDISING', 'Khối Khách Hàng và Bán Lẻ', 'Tổng Giám Đốc Công Ty PNJ', '2026-04-28', 1, '3.0', '3.5', 340);

do $$
declare
  source_row imported_process_map%rowtype;
  target_process_id uuid;
  target_version_id uuid;
  target_apqc_id uuid;
  metadata_value text;
begin
  if (select count(*) from imported_process_map) <> 34 then
    raise exception 'Expected 34 source processes';
  end if;

  if exists (
    select 1 from imported_process_map source
    left join public.apqc_elements l1
      on l1.hierarchy_id = source.apqc_l1_hierarchy and l1.level_number = 2
    left join public.apqc_elements l0 on l0.id = l1.parent_id
    where l1.id is null or l0.hierarchy_id <> source.apqc_l0_hierarchy
  ) then
    raise exception 'Source APQC L0/L1 path does not match the imported APQC reference';
  end if;

  for source_row in select * from imported_process_map order by display_order loop
    target_process_id := null;

    if source_row.process_code = 'PNJ-QT-VPBL-BH-BHTG' then
      select p.id into target_process_id
      from public.processes p
      where p.process_code in ('PNJ-QT-VPBL-BH-BHTG', 'TG-L1')
      order by (p.process_code = 'PNJ-QT-VPBL-BH-BHTG') desc
      limit 1;
    else
      select p.id into target_process_id
      from public.processes p
      where p.process_code = source_row.process_code;
    end if;

    if target_process_id is null then
      insert into public.processes (process_code, source_code, level_type, display_order)
      values (source_row.process_code, source_row.process_code, 'process', 1000 + source_row.display_order)
      returning id into target_process_id;

      insert into public.process_versions (
        process_id, version_number, status, name_vi, purpose, description, scope_in, scope_out, trigger, outcome,
        valid_from, change_summary
      ) values (
        target_process_id, 1, 'draft', source_row.name_vi, '', '', '', '', '', '', source_row.valid_from,
        'Nhập từ Process Map.xlsx; số lần soát xét theo nguồn: ' || source_row.source_review_count::text || '.'
      ) returning id into target_version_id;
    else
      update public.processes
      set process_code = source_row.process_code,
          source_code = source_row.process_code,
          display_order = case when process_code = 'TG-L1' then display_order else 1000 + source_row.display_order end,
          updated_at = now()
      where id = target_process_id;

      select pv.id into target_version_id
      from public.process_versions pv
      where pv.process_id = target_process_id
      order by pv.version_number desc
      limit 1;

      update public.process_versions
      set name_vi = source_row.name_vi,
          valid_from = source_row.valid_from,
          change_summary = case
            when change_summary like '%Process Map.xlsx%' then change_summary
            when nullif(trim(change_summary), '') is null then
              'Nhập từ Process Map.xlsx; số lần soát xét theo nguồn: ' || source_row.source_review_count::text || '.'
            else change_summary || E'\n' ||
              'Đối chiếu Process Map.xlsx; số lần soát xét theo nguồn: ' || source_row.source_review_count::text || '.'
          end,
          updated_at = now()
      where id = target_version_id;
    end if;

    if target_version_id is null then
      raise exception 'No process version found for %', source_row.process_code;
    end if;

    foreach metadata_value in array array[source_row.drafting_department, source_row.drafting_unit] loop
      if nullif(trim(metadata_value), '') is not null and not exists (
        select 1 from public.object_applicability oa
        where oa.object_type = 'process_version'
          and oa.object_id = target_version_id
          and oa.dimension = 'department'
          and oa.free_text = metadata_value
      ) then
        insert into public.object_applicability (object_type, object_id, dimension, free_text)
        values ('process_version', target_version_id, 'department', metadata_value);
      end if;
    end loop;

    select ae.id into target_apqc_id
    from public.apqc_elements ae
    where ae.hierarchy_id = source_row.apqc_l1_hierarchy and ae.level_number = 2;

    if source_row.process_code = 'PNJ-QT-VPBL-BH-BHTG' then
      delete from public.process_apqc_mappings pam
      using public.apqc_elements ae
      where pam.process_version_id = target_version_id
        and pam.apqc_element_id = ae.id
        and ae.level_number = 1
        and pam.mapping_role = 'primary'
        and pam.status = 'proposed';
    end if;

    insert into public.process_apqc_mappings (
      process_version_id, apqc_element_id, mapping_role, match_type, status, rationale
    ) values (
      target_version_id, target_apqc_id, 'primary', 'related', 'proposed',
      'Process Map.xlsx gán quy trình vào APQC ' || source_row.apqc_l1_hierarchy ||
      '; chờ Process Owner xác nhận mức độ khớp.'
    )
    on conflict (process_version_id, apqc_element_id, mapping_role) do update
    set match_type = excluded.match_type,
        status = case when public.process_apqc_mappings.status = 'verified' then 'verified' else excluded.status end,
        rationale = case when public.process_apqc_mappings.status = 'verified'
          then public.process_apqc_mappings.rationale else excluded.rationale end;
  end loop;
end
$$;
