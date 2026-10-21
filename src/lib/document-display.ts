/**
 * Document presentation labels. Persisted enum/group codes and vocabulary IDs
 * are stable; only the Vietnamese presentation changes.
 */
export const documentGroupOptions = [
  { value: "governance", label: "Quản trị" },
  { value: "execution", label: "Vận hành" },
  { value: "communication", label: "Truyền thông & đào tạo" },
  { value: "evidence", label: "Hồ sơ & báo cáo" },
  { value: "planning", label: "Kế hoạch & dự án" },
  { value: "external", label: "Tài liệu bên ngoài" },
  { value: "other", label: "Khác" },
] as const;

export const documentStatusOptions = [
  { value: "draft", label: "Bản nháp" },
  { value: "in_review", label: "Đang trình duyệt" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "approved", label: "Đã phê duyệt" },
  { value: "scheduled", label: "Chờ hiệu lực" },
  { value: "effective", label: "Đang hiệu lực" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "superseded", label: "Đã thay thế" },
  { value: "archived", label: "Lưu trữ" },
] as const;

export const documentAccessOptions = [
  { value: "internal", label: "Nội bộ" },
  { value: "limited", label: "Giới hạn" },
  { value: "confidential", label: "Bảo mật" },
  { value: "highly_restricted", label: "Hạn chế cao" },
] as const;

export const documentRiskOptions = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Trọng yếu" },
] as const;

export const documentLanguageOptions = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
  { value: "vi-en", label: "Song ngữ" },
] as const;

export function documentOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  code: string | null | undefined,
  fallback = "Chưa xác định",
) {
  if (!code) return fallback;
  return options.find((option) => option.value.toLowerCase() === code.toLowerCase())?.label ?? fallback;
}

export function documentDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const [yyyy, mm, dd] = value.split("-");
  return `${dd}/${mm}/${yyyy}`;
}
