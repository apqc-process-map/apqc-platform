import Link from "next/link";

type PaginationProps = {
  pathname: string;
  currentPage: number;
  total: number;
  pageSize: number;
  params?: Record<string, string | undefined>;
};

export default function Pagination({ pathname, currentPage, total, pageSize, params = {} }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const href = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value && value !== "all") query.set(key, value);
    if (page > 1) query.set("page", String(page));
    const suffix = query.toString();
    return suffix ? `${pathname}?${suffix}` : pathname;
  };
  return <nav className="pagination" aria-label="Phân trang">
    {currentPage > 1 ? <Link href={href(currentPage - 1)}>← Trang trước</Link> : <span aria-disabled="true">← Trang trước</span>}
    <strong>Trang {currentPage} / {totalPages}</strong>
    {currentPage < totalPages ? <Link href={href(currentPage + 1)}>Trang sau →</Link> : <span aria-disabled="true">Trang sau →</span>}
  </nav>;
}