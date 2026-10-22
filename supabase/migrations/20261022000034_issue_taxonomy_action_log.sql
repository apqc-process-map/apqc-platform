-- Governed issue taxonomy and intake metadata derived from Issue.xlsx.
create table public.issue_taxonomy (
  code text primary key check (code ~ '^[A-D][1-3]$'),
  group_code text not null check (group_code in ('A','B','C','D')),
  group_label_vi text not null,
  type_label_vi text not null,
  explanation_vi text not null,
  decision_order smallint not null unique check (decision_order between 1 and 11),
  decision_question_vi text not null,
  minimum_evidence_vi text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.issue_taxonomy
  (code,group_code,group_label_vi,type_label_vi,explanation_vi,decision_order,decision_question_vi,minimum_evidence_vi)
values
('B2','B','Hiệu lực & vòng đời','Đã bị thay thế/bãi bỏ nhưng nguồn cũ chưa cập nhật','Tài liệu đã bị thay thế hoặc bãi bỏ toàn phần/một phần nhưng trạng thái nguồn cũ chưa được cập nhật.',1,'Có quyết định thay thế/bãi bỏ nhưng nguồn cũ vẫn được hiển thị là hiện hành?','Quyết định thay thế/bãi bỏ và trạng thái nguồn tại thời điểm kiểm tra'),
('B1','B','Hiệu lực & vòng đời','Hết thời hạn áp dụng nhưng vẫn active','Tài liệu đã hết thời hạn áp dụng, chưa có gia hạn nhưng vẫn được hiển thị hoặc sử dụng là hiện hành.',2,'Tài liệu đã hết hạn, không có gia hạn nhưng vẫn active?','Ngày hết hạn, bằng chứng không gia hạn và trạng thái tại thời điểm kiểm tra'),
('B3','B','Hiệu lực & vòng đời','Trạng thái kích hoạt/tạm ngưng/khôi phục không đồng bộ','Quyết định kích hoạt, tạm ngưng hoặc khôi phục nghiệp vụ chưa được phản ánh đồng bộ trên các kênh.',3,'Quyết định tạm ngưng/khôi phục chưa được phản ánh đồng bộ?','Quyết định tạm thời và trạng thái thực tế trên từng kênh'),
('C1','C','Quan hệ & viện dẫn','Viện dẫn sai hoặc hết hiệu lực','Tài liệu viện dẫn sai nguồn, sai điều khoản hoặc viện dẫn một nguồn đã hết hiệu lực.',4,'Có viện dẫn sai điều khoản, sai nguồn hoặc nguồn đã hết hiệu lực?','Điều khoản viện dẫn và nguồn đúng/nguồn lỗi'),
('C2','C','Quan hệ & viện dẫn','Thiếu hoặc sai liên kết tài liệu','Quan hệ giữa tài liệu chính, phụ lục, biểu mẫu hoặc hướng dẫn bị thiếu hoặc khai báo sai.',5,'Quan hệ tài liệu chính–phụ lục–biểu mẫu có thiếu hoặc sai?','Quan hệ bắt buộc và quan hệ đang được khai báo'),
('A1','A','Nhất quán & chính xác về nội dung','Mâu thuẫn quy tắc','Hai hoặc nhiều tài liệu đang hiệu lực, áp dụng cùng tình huống nhưng đưa ra yêu cầu hoặc kết luận khác nhau.',6,'Có hai quy tắc cùng hiệu lực và phạm vi nhưng mâu thuẫn?','Hai điều khoản và đối chiếu thời gian hiệu lực/phạm vi'),
('A3','A','Nhất quán & chính xác về nội dung','Nội dung không khớp vận hành đã được phê duyệt','Nội dung tài liệu không còn khớp quy trình, hệ thống hoặc mô hình vận hành đã được phê duyệt.',7,'Nội dung có khác quy trình, hệ thống hoặc mô hình đã phê duyệt?','Tài liệu và căn cứ vận hành chính thức'),
('A2','A','Nhất quán & chính xác về nội dung','Không rõ điều kiện/phạm vi áp dụng','Quy định thiếu điều kiện, đối tượng, ngoại lệ hoặc giới hạn nên có thể được hiểu theo nhiều cách hợp lý.',8,'Điều kiện, ngoại lệ hoặc phạm vi có thể được hiểu theo nhiều cách?','Điều khoản chưa rõ và ít nhất hai cách hiểu hợp lý'),
('D1','D','Kiến trúc tài liệu','Sai loại hoặc trộn tầng nội dung','Nội dung được đặt sai loại tài liệu hoặc trộn lẫn các tầng chính sách, quy trình, hướng dẫn và biểu mẫu.',9,'Nội dung có nằm sai loại tài liệu hoặc trộn tầng?','Bản chất nội dung và tiêu chuẩn phân loại'),
('D2','D','Kiến trúc tài liệu','Dữ liệu động nằm trong văn bản tĩnh','Dữ liệu thay đổi thường xuyên được ghi cố định trong văn bản thay vì quản lý tại nguồn dữ liệu phù hợp.',10,'Dữ liệu thường xuyên thay đổi có đang nằm trong văn bản tĩnh?','Loại dữ liệu, nguồn quản lý và mô hình cập nhật'),
('D3','D','Kiến trúc tài liệu','Nhiều nguồn độc lập cùng quản lý một quy tắc','Cùng một quy tắc được duy trì độc lập ở nhiều nguồn, tạo nguy cơ cập nhật không đồng bộ.',11,'Cùng một quy tắc có được quản lý độc lập ở nhiều nguồn?','Các nguồn chứa quy tắc và cơ chế quản lý thay đổi')
on conflict (code) do update set
  group_code=excluded.group_code,group_label_vi=excluded.group_label_vi,
  type_label_vi=excluded.type_label_vi,explanation_vi=excluded.explanation_vi,
  decision_order=excluded.decision_order,decision_question_vi=excluded.decision_question_vi,
  minimum_evidence_vi=excluded.minimum_evidence_vi,is_active=true,updated_at=now();

alter table public.issue_taxonomy enable row level security;
grant select on public.issue_taxonomy to authenticated;
revoke all on public.issue_taxonomy from anon;
create policy "active users read issue taxonomy" on public.issue_taxonomy
for select to authenticated using ((select public.current_profile_role()) is not null);

alter table public.findings
  add column if not exists primary_issue_code text references public.issue_taxonomy(code),
  add column if not exists secondary_issue_codes text[] not null default '{}',
  add column if not exists classification_rationale text,
  add column if not exists decision_point text,
  add column if not exists evidence_status text not null default 'candidate'
    check (evidence_status in ('candidate','pending','validated','rejected')),
  add column if not exists proposed_action text,
  add column if not exists owner_question text,
  add column if not exists process_owner_feedback text;

create index if not exists findings_primary_issue_idx
  on public.findings(primary_issue_code,status,created_at desc);

comment on column public.findings.primary_issue_code is 'Single primary taxonomy code used for reporting; secondary codes are tags only.';
comment on column public.findings.secondary_issue_codes is 'Optional secondary taxonomy tags; never counted as the primary issue.';
