import Link from "next/link";
import { signIn } from "./actions";

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="auth-shell"><section className="auth-card" aria-labelledby="login-title"><div className="brand-mark auth-mark">PM</div><p className="eyebrow accent">PROCESS GOVERNANCE</p><h1 id="login-title">Đăng nhập Process Map</h1><p className="auth-copy">Sử dụng tài khoản doanh nghiệp của bạn để truy cập không gian quản trị quy trình.</p>{params.error && <p className="auth-error" role="alert">{params.error === "missing" ? "Vui lòng nhập email và mật khẩu." : params.error}</p>}<form action={signIn} className="auth-form"><label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button auth-submit" type="submit">Đăng nhập</button></form><Link className="auth-back" href="/">← Quay lại trang demo</Link></section></main>;
}
