import { useState } from "react";
import { api } from "../services/api.js";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login(username.trim(), password);
      const user = await api.getMe();
      onLogin(user);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-icon">S</div>
        <p className="eyebrow">STUDENT MANAGEMENT SYSTEM</p>
        <h1>Đăng nhập</h1>
        <p className="muted">
          Đăng nhập để xem và quản lý kết quả học tập.
        </p>

        {error && <div className="alert error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            required
          />

          <button
            className="primary-button login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="login-footer">
          Hệ thống quản lý sinh viên
        </p>
      </section>
    </main>
  );
}