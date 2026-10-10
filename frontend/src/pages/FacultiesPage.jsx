
import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";


const emptyForm = {
  facultyCode: "",
  facultyName: "",
};

export default function FacultiesPage({ userRole = "Teacher" }) {
  const isAdmin = userRole === "Admin";
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

// Tự động tải danh sách khoa khi mở trang hoặc thay đổi từ khóa.
useEffect(() => {
let cancelled = false;


async function fetchFaculties() {
  try {
    const result = await api.getFaculties(search.trim());

    if (!cancelled) {
      setFaculties(Array.isArray(result) ? result : []);
      setError("");
      setLoading(false);
    }
  } catch (err) {
    if (!cancelled) {
      setError(err.message || "Không thể tải danh sách khoa.");
      setLoading(false);
    }
  }
}

fetchFaculties();

return () => {
  cancelled = true;
};


}, [search]);

// Dùng cho nút Làm mới và sau khi thêm, sửa hoặc xóa khoa.
const loadFaculties = useCallback(async () => {
setLoading(true);
setError("");


try {
  const result = await api.getFaculties(search.trim());
  setFaculties(Array.isArray(result) ? result : []);
} catch (err) {
  setError(err.message || "Không thể tải danh sách khoa.");
} finally {
  setLoading(false);
}


}, [search]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowModal(true);
  }

  function openEditModal(faculty) {
    setEditingId(faculty.id);
    setForm({
      facultyCode: faculty.facultyCode ?? "",
      facultyName: faculty.facultyName ?? "",
    });
    setError("");
    setNotice("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const facultyCode = form.facultyCode.trim();
    const facultyName = form.facultyName.trim();

    if (!facultyCode || !facultyName) {
      setError("Vui lòng nhập đầy đủ mã khoa và tên khoa.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data = { facultyCode, facultyName };

      if (editingId !== null) {
        await api.updateFaculty(editingId, data);
        setNotice("Cập nhật khoa thành công.");
      } else {
        await api.createFaculty(data);
        setNotice("Thêm khoa thành công.");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadFaculties();
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(faculty) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khoa "${faculty.facultyName}" không?`
    );

    if (!confirmed) return;

    setDeletingId(faculty.id);
    setError("");
    setNotice("");

    try {
      await api.deleteFaculty(faculty.id);
      setNotice("Xóa khoa thành công.");
      await loadFaculties();
    } catch (err) {
      setError(
        err.message ||
          "Không thể xóa khoa. Hãy kiểm tra xem khoa có lớp học liên kết không."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalClasses = faculties.reduce(
    (total, faculty) => total + (Number(faculty.classCount) || 0),
    0
  );

  return (
    <div className="faculty-page">
      <div className="faculty-page__header">
        <div>
          <p>Quản lý thông tin khoa và theo dõi số lớp học trực thuộc.</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="faculty-btn faculty-btn--primary"
            onClick={openCreateModal}
          >
            <span className="faculty-btn__plus">+</span>
            Thêm khoa
          </button>
        )}
      </div>

      {notice && (
        <div className="faculty-alert faculty-alert--success">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      {error && !showModal && (
        <div className="faculty-alert faculty-alert--error">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      <div className="faculty-stats">
        <div className="faculty-stat-card">
          <div className="faculty-stat-card__icon faculty-stat-card__icon--blue">
            K
          </div>
          <div>
            <div className="faculty-stat-card__label">Tổng số khoa</div>
            <div className="faculty-stat-card__value">{faculties.length}</div>
          </div>
        </div>

        <div className="faculty-stat-card">
          <div className="faculty-stat-card__icon faculty-stat-card__icon--purple">
            L
          </div>
          <div>
            <div className="faculty-stat-card__label">
              Số lớp thuộc các khoa đang hiển thị
            </div>
            <div className="faculty-stat-card__value">{totalClasses}</div>
          </div>
        </div>
      </div>

      <section className="faculty-panel">
        <div className="faculty-panel__toolbar">
          <div>
            <h2>Danh sách khoa</h2>
            <p>Tra cứu và quản lý các khoa trong hệ thống.</p>
          </div>

          <div className="faculty-search">
            <span className="faculty-search__icon">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên khoa..."
              aria-label="Tìm kiếm khoa"
            />
            {search && (
              <button
                type="button"
                className="faculty-search__clear"
                onClick={() => setSearch("")}
                aria-label="Xóa nội dung tìm kiếm"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="faculty-table-wrap">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>MÃ KHOA</th>
                <th>TÊN KHOA</th>
                <th>SỐ LỚP</th>
                {isAdmin && <th className="faculty-table__action-heading">THAO TÁC</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="faculty-table__state">
                    <span className="faculty-spinner" />
                    Đang tải danh sách khoa...
                  </td>
                </tr>
              ) : faculties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="faculty-table__state">
                    <div className="faculty-empty">
                      <div className="faculty-empty__icon">⌕</div>
                      <strong>Không tìm thấy khoa</strong>
                      <span>
                        {search
                          ? "Thử thay đổi từ khóa tìm kiếm."
                          : "Bạn có thể nhấn “Thêm khoa” để tạo khoa đầu tiên."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                faculties.map((faculty, index) => (
                  <tr key={faculty.id}>
                    <td className="faculty-table__number">
                      {index + 1}
                    </td>
                    <td>
                      <span className="faculty-code">
                        {faculty.facultyCode}
                      </span>
                    </td>
                    <td>
                      <div className="faculty-name">
                        <span className="faculty-name__avatar">
                          {(faculty.facultyName || "K").charAt(0).toUpperCase()}
                        </span>
                        <span>{faculty.facultyName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="faculty-class-count">
                        {Number(faculty.classCount) || 0} lớp
                      </span>
                    </td>
                    {isAdmin && <td>
                      <div className="faculty-actions">
                        <button
                          type="button"
                          className="faculty-action faculty-action--edit"
                          onClick={() => openEditModal(faculty)}
                          title="Sửa khoa"
                          aria-label={`Sửa khoa ${faculty.facultyName}`}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="faculty-action faculty-action--delete"
                          onClick={() => handleDelete(faculty)}
                          disabled={deletingId === faculty.id}
                          title="Xóa khoa"
                          aria-label={`Xóa khoa ${faculty.facultyName}`}
                        >
                          {deletingId === faculty.id ? "…" : "×"}
                        </button>
                      </div>
                    </td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="faculty-panel__footer">
          <span>
            {loading
              ? "Đang tải dữ liệu..."
              : `Đang hiển thị ${faculties.length} khoa`}
          </span>
          <button
            type="button"
            className="faculty-refresh"
            onClick={loadFaculties}
            disabled={loading}
          >
            ↻ Làm mới
          </button>
        </div>
      </section>

      {isAdmin && showModal && (
        <div
          className="faculty-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="faculty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-modal-title"
          >
            <div className="faculty-modal__header">
              <div>
                <div className="faculty-page__eyebrow">
                  THÔNG TIN KHOA
                </div>
                <h2 id="faculty-modal-title">
                  {editingId !== null ? "Cập nhật khoa" : "Thêm khoa mới"}
                </h2>
                <p>Nhập thông tin cơ bản của khoa.</p>
              </div>
              <button
                type="button"
                className="faculty-modal__close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="faculty-alert faculty-alert--error">
                  {error}
                </div>
              )}

              <div className="faculty-form-field">
                <label htmlFor="facultyCode">
                  Mã khoa <span>*</span>
                </label>
                <input
                  id="facultyCode"
                  name="facultyCode"
                  value={form.facultyCode}
                  onChange={handleChange}
                  placeholder="Ví dụ: CNTT"
                  maxLength={20}
                  required
                  autoFocus
                />
                <small>Mã khoa không quá 20 ký tự.</small>
              </div>

              <div className="faculty-form-field">
                <label htmlFor="facultyName">
                  Tên khoa <span>*</span>
                </label>
                <input
                  id="facultyName"
                  name="facultyName"
                  value={form.facultyName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Công nghệ thông tin"
                  maxLength={100}
                  required
                />
                <small>Tên khoa không quá 100 ký tự.</small>
              </div>

              <div className="faculty-modal__footer">
                <button
                  type="button"
                  className="faculty-btn faculty-btn--secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="faculty-btn faculty-btn--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId !== null
                      ? "Lưu thay đổi"
                      : "Tạo khoa"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
