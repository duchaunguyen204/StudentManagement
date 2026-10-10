export default function Header({ title, user }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">HỆ THỐNG QUẢN LÝ ĐÀO TẠO</p>
        <h1>{title}</h1>
      </div>

      <div className="user-badge">
        <span className="status-dot" />
        {user?.role === "Teacher" ? "Giáo viên" : "Sinh viên"}
      </div>
    </header>
  );
}