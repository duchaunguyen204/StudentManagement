import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

const emptyForm = { teacherCode: "", fullName: "", email: "", username: "", password: "" };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTeachers = useCallback(async (keyword = search) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getTeachers(keyword);
      setTeachers(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách giáo viên.");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadTeachers(""); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function beginCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function beginEdit(teacher) {
    setEditingId(teacher.id);
    setForm({ teacherCode: teacher.teacherCode, fullName: teacher.fullName, email: teacher.email, username: teacher.username, password: "" });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function changeField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      if (editingId) {
        const { password, ...data } = form;
        await api.updateTeacher(editingId, data);
        setNotice("Cập nhật thông tin giáo viên thành công.");
      } else {
        await api.createTeacher(form);
        setNotice("Thêm giáo viên và tạo tài khoản thành công.");
      }
      setShowForm(false); setForm(emptyForm); setEditingId(null);
      await loadTeachers(search);
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin giáo viên.");
    } finally { setSaving(false); }
  }

  async function removeTeacher(teacher) {
    if (!window.confirm(`Bạn có chắc muốn xóa giáo viên ${teacher.fullName} (${teacher.teacherCode})? Tài khoản đăng nhập cũng sẽ bị xóa.`)) return;
    setError(""); setNotice("");
    try {
      await api.deleteTeacher(teacher.id);
      setNotice("Đã xóa giáo viên và tài khoản đăng nhập.");
      await loadTeachers(search);
    } catch (err) {
      setError(err.message || "Không thể xóa giáo viên.");
    }
  }

  return (
    <section className="teachers-page" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Quản lý giáo viên</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>Quản lý hồ sơ giáo viên và tài khoản đăng nhập.</p>
        </div>
        <button type="button" className="primary-button" onClick={beginCreate}>+ Thêm giáo viên</button>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert success" role="status">{notice}</div>}

      {showForm && <form onSubmit={submitForm} style={{ display: "grid", gap: 14, padding: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14 }}>
        <h3 style={{ margin: 0 }}>{editingId ? "Cập nhật giáo viên" : "Thêm giáo viên mới"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <label className="teacher-field">Mã giáo viên<input name="teacherCode" value={form.teacherCode} onChange={changeField} required maxLength={20} placeholder="GV0002" /></label>
          <label className="teacher-field">Họ và tên<input name="fullName" value={form.fullName} onChange={changeField} required maxLength={100} placeholder="Nguyễn Văn A" /></label>
          <label className="teacher-field">Email<input name="email" type="email" value={form.email} onChange={changeField} required maxLength={100} placeholder="gv@example.com" /></label>
          <label className="teacher-field">Tên đăng nhập<input name="username" value={form.username} onChange={changeField} required minLength={3} maxLength={50} placeholder="giaovien02" /></label>
          {!editingId && <label className="teacher-field">Mật khẩu<input name="password" type="password" value={form.password} onChange={changeField} required minLength={8} maxLength={100} autoComplete="new-password" placeholder="Ít nhất 8 ký tự" /></label>}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{editingId ? "Đổi mật khẩu cần thực hiện bằng chức năng riêng; biểu mẫu này chỉ sửa hồ sơ và tên đăng nhập." : "Mật khẩu được mã hóa trước khi lưu vào cơ sở dữ liệu."}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="secondary-button" onClick={() => { setShowForm(false); setError(""); }}>Hủy</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo giáo viên"}</button>
        </div>
      </form>}

      <form onSubmit={event => { event.preventDefault(); loadTeachers(search); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input aria-label="Tìm giáo viên" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo mã, họ tên, email hoặc tài khoản..." style={{ flex: "1 1 280px", minWidth: 0, padding: "11px 13px", border: "1px solid #cbd5e1", borderRadius: 10 }} />
        <button type="submit" className="secondary-button">Tìm kiếm</button>
        <button type="button" className="secondary-button" onClick={() => { setSearch(""); loadTeachers(""); }}>Đặt lại</button>
      </form>

      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead><tr style={{ background: "#f8fafc", textAlign: "left" }}>
            { ["Mã giáo viên", "Họ và tên", "Email", "Tài khoản", "Số bảng điểm", "Thao tác"].map(title => <th key={title} style={{ padding: "13px 15px", fontSize: 13, color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{title}</th>) }
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</td></tr> : teachers.length === 0 ? <tr><td colSpan="6" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Không tìm thấy giáo viên.</td></tr> : teachers.map(teacher => <tr key={teacher.id}>
              <td style={cellStyle}><strong>{teacher.teacherCode}</strong></td><td style={cellStyle}>{teacher.fullName}</td><td style={cellStyle}>{teacher.email}</td><td style={cellStyle}>{teacher.username}</td><td style={cellStyle}>{teacher.gradeCount ?? 0}</td>
              <td style={{ ...cellStyle, whiteSpace: "nowrap" }}><button type="button" className="secondary-button" onClick={() => beginEdit(teacher)}>Sửa</button> <button type="button" className="danger-button" onClick={() => removeTeacher(teacher)}>Xóa</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Tổng số: {teachers.length} giáo viên. Không thể xóa giáo viên đang có dữ liệu điểm liên kết.</p>
    </section>
  );
}

const cellStyle = { padding: "13px 15px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontSize: 14 };
