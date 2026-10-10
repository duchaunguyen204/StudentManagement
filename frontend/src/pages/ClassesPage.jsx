import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";


const emptyForm = {
classCode: "",
className: "",
facultyId: "",
};

export default function ClassesPage({ userRole = "Teacher" }) {
const isAdmin = userRole === "Admin";
const [classes, setClasses] = useState([]);
const [faculties, setFaculties] = useState([]);
const [search, setSearch] = useState("");
const [filterFacultyId, setFilterFacultyId] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deletingId, setDeletingId] = useState(null);
const [error, setError] = useState("");
const [notice, setNotice] = useState("");
const [showModal, setShowModal] = useState(false);
const [editingId, setEditingId] = useState(null);
const [form, setForm] = useState(emptyForm);

// Tải danh sách khoa khi mở trang.
useEffect(() => {
let cancelled = false;

async function fetchFaculties() {
  try {
    const result = await api.getFaculties();

    if (!cancelled) {
      setFaculties(Array.isArray(result) ? result : []);
    }
  } catch (err) {
    if (!cancelled) {
      setError(err.message || "Không thể tải danh sách khoa.");
    }
  }
}

fetchFaculties();

return () => {
  cancelled = true;
};


}, []);

// Tải danh sách lớp khi mở trang hoặc thay đổi bộ lọc.
useEffect(() => {
let cancelled = false;


async function fetchClasses() {
  try {
    const result = await api.getClasses(
      search.trim(),
      filterFacultyId || null
    );

    if (!cancelled) {
      setClasses(Array.isArray(result) ? result : []);
      setError("");
      setLoading(false);
    }
  } catch (err) {
    if (!cancelled) {
      setError(err.message || "Không thể tải danh sách lớp.");
      setLoading(false);
    }
  }
}

fetchClasses();

return () => {
  cancelled = true;
};


}, [search, filterFacultyId]);

// Làm mới thủ công hoặc tải lại sau khi thêm, sửa, xóa.
const loadClasses = useCallback(async () => {
setLoading(true);
setError("");

try {
  const result = await api.getClasses(
    search.trim(),
    filterFacultyId || null
  );

  setClasses(Array.isArray(result) ? result : []);
} catch (err) {
  setError(err.message || "Không thể tải danh sách lớp.");
} finally {
  setLoading(false);
}


}, [search, filterFacultyId]);

function handleSearchChange(event) {
setSearch(event.target.value);
setLoading(true);
setError("");
}

function handleFacultyFilterChange(event) {
setFilterFacultyId(event.target.value);
setLoading(true);
setError("");
}

function openCreateModal() {
setEditingId(null);
setForm(emptyForm);
setError("");
setNotice("");
setShowModal(true);
}

function openEditModal(item) {
setEditingId(item.id);
setForm({
classCode: item.classCode ?? "",
className: item.className ?? "",
facultyId: item.facultyId == null ? "" : String(item.facultyId),
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


if (!form.classCode.trim() || !form.className.trim()) {
  setError("Vui lòng nhập đầy đủ mã lớp và tên lớp.");
  return;
}

setSaving(true);
setError("");

try {
  const data = {
    classCode: form.classCode.trim(),
    className: form.className.trim(),
    facultyId: form.facultyId ? Number(form.facultyId) : null,
  };

  if (editingId !== null) {
    await api.updateClass(editingId, data);
    setNotice("Cập nhật lớp học thành công.");
  } else {
    await api.createClass(data);
    setNotice("Thêm lớp học thành công.");
  }

  setShowModal(false);
  setEditingId(null);
  setForm(emptyForm);

  await loadClasses();
} catch (err) {
  setError(err.message || "Không thể lưu thông tin lớp học.");
} finally {
  setSaving(false);
}


}

async function handleDelete(item) {
const confirmed = window.confirm(
`Bạn có chắc muốn xóa lớp "${item.className}" không?`
);


if (!confirmed) return;

setDeletingId(item.id);
setError("");
setNotice("");

try {
  await api.deleteClass(item.id);
  setNotice("Xóa lớp học thành công.");
  await loadClasses();
} catch (err) {
  setError(
    err.message ||
      "Không thể xóa lớp. Lớp có thể đang có sinh viên liên kết."
  );
} finally {
  setDeletingId(null);
}


}

const totalStudents = classes.reduce(
(total, item) => total + (Number(item.studentCount) || 0),
0
);

return ( <div className="classes-page"> <div className="classes-page__header"> <div>  <p>Quản lý lớp học, khoa trực thuộc và số lượng sinh viên.</p> </div>


    {isAdmin && (
      <button
        type="button"
        className="classes-btn classes-btn--primary"
        onClick={openCreateModal}
      >
        <span className="classes-btn__plus">+</span>
        Thêm lớp học
      </button>
    )}
  </div>

  {notice && (
    <div className="classes-alert classes-alert--success">
      <span>{notice}</span>
      <button type="button" onClick={() => setNotice("")}>
        ×
      </button>
    </div>
  )}

  {error && !showModal && (
    <div className="classes-alert classes-alert--error">
      <span>{error}</span>
      <button type="button" onClick={() => setError("")}>
        ×
      </button>
    </div>
  )}

  <div className="classes-stats">
    <div className="classes-stat-card">
      <div className="classes-stat-card__icon classes-stat-card__icon--blue">
        L
      </div>
      <div>
        <div className="classes-stat-card__label">
          Số lớp đang hiển thị
        </div>
        <div className="classes-stat-card__value">{classes.length}</div>
      </div>
    </div>

    <div className="classes-stat-card">
      <div className="classes-stat-card__icon classes-stat-card__icon--purple">
        K
      </div>
      <div>
        <div className="classes-stat-card__label">Tổng số khoa</div>
        <div className="classes-stat-card__value">{faculties.length}</div>
      </div>
    </div>

    <div className="classes-stat-card">
      <div className="classes-stat-card__icon classes-stat-card__icon--green">
        SV
      </div>
      <div>
        <div className="classes-stat-card__label">
          Sinh viên thuộc các lớp đang hiển thị
        </div>
        <div className="classes-stat-card__value">{totalStudents}</div>
      </div>
    </div>
  </div>

  <section className="classes-panel">
    <div className="classes-panel__toolbar">
      <div>
        <h2>Danh sách lớp học</h2>
        <p>Tra cứu lớp và lọc theo khoa quản lý.</p>
      </div>

      <div className="classes-filters">
        <div className="classes-search">
          <span className="classes-search__icon">⌕</span>
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Tìm mã lớp, tên lớp..."
            aria-label="Tìm kiếm lớp học"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLoading(true);
                setError("");
              }}
              aria-label="Xóa từ khóa"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="classes-filter-select"
          value={filterFacultyId}
          onChange={handleFacultyFilterChange}
          aria-label="Lọc theo khoa"
        >
          <option value="">Tất cả khoa</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.facultyName}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="classes-table-wrap">
      <table className="classes-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>MÃ LỚP</th>
            <th>TÊN LỚP</th>
            <th>KHOA</th>
            <th>SINH VIÊN</th>
            {isAdmin && <th className="classes-table__action-heading">THAO TÁC</th>}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="classes-table__state">
                <span className="classes-spinner" />
                Đang tải danh sách lớp học...
              </td>
            </tr>
          ) : classes.length === 0 ? (
            <tr>
              <td colSpan={6} className="classes-table__state">
                <div className="classes-empty">
                  <div className="classes-empty__icon">⌕</div>
                  <strong>Không tìm thấy lớp học</strong>
                  <span>
                    Thử thay đổi bộ lọc hoặc tạo lớp học mới.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            classes.map((item, index) => (
              <tr key={item.id}>
                <td className="classes-table__number">{index + 1}</td>
                <td>
                  <span className="classes-code">{item.classCode}</span>
                </td>
                <td>
                  <div className="classes-name">
                    <span className="classes-name__avatar">
                      {(item.className || "L").charAt(0).toUpperCase()}
                    </span>
                    <span>{item.className}</span>
                  </div>
                </td>
                <td>
                  {item.facultyName ? (
                    <span className="classes-faculty">
                      {item.facultyName}
                    </span>
                  ) : (
                    <span className="classes-unassigned">
                      Chưa phân khoa
                    </span>
                  )}
                </td>
                <td>
                  <span className="classes-student-count">
                    {Number(item.studentCount) || 0}
                  </span>
                </td>
                {isAdmin && <td>
                  <div className="classes-actions">
                    <button
                      type="button"
                      className="classes-action classes-action--edit"
                      onClick={() => openEditModal(item)}
                      title="Sửa lớp"
                      aria-label={`Sửa lớp ${item.className}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="classes-action classes-action--delete"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      title="Xóa lớp"
                      aria-label={`Xóa lớp ${item.className}`}
                    >
                      {deletingId === item.id ? "…" : "×"}
                    </button>
                  </div>
                </td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <div className="classes-panel__footer">
      <span>
        {loading
          ? "Đang tải dữ liệu..."
          : `Đang hiển thị ${classes.length} lớp`}
      </span>

      <button
        type="button"
        className="classes-refresh"
        onClick={loadClasses}
        disabled={loading}
      >
        ↻ Làm mới
      </button>
    </div>
  </section>

  {isAdmin && showModal && (
    <div
      className="classes-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        className="classes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="classes-modal-title"
      >
        <div className="classes-modal__header">
          <div>
            <div className="classes-page__eyebrow">THÔNG TIN LỚP</div>
            <h2 id="classes-modal-title">
              {editingId !== null ? "Cập nhật lớp học" : "Thêm lớp học"}
            </h2>
            <p>Nhập thông tin lớp và chọn khoa trực thuộc.</p>
          </div>

          <button
            type="button"
            className="classes-modal__close"
            onClick={closeModal}
            disabled={saving}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="classes-alert classes-alert--error">
              {error}
            </div>
          )}

          <div className="classes-form-field">
            <label htmlFor="classCode">
              Mã lớp <span>*</span>
            </label>
            <input
              id="classCode"
              name="classCode"
              value={form.classCode}
              onChange={handleChange}
              placeholder="Ví dụ: CNTT01"
              maxLength={20}
              required
              autoFocus
            />
          </div>

          <div className="classes-form-field">
            <label htmlFor="className">
              Tên lớp <span>*</span>
            </label>
            <input
              id="className"
              name="className"
              value={form.className}
              onChange={handleChange}
              placeholder="Ví dụ: Công nghệ thông tin 01"
              maxLength={100}
              required
            />
          </div>

          <div className="classes-form-field">
            <label htmlFor="facultyId">Khoa trực thuộc</label>
            <select
              id="facultyId"
              name="facultyId"
              value={form.facultyId}
              onChange={handleChange}
            >
              <option value="">Chưa phân khoa</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.facultyCode} - {faculty.facultyName}
                </option>
              ))}
            </select>
            <small>
              Có thể để trống nếu chưa muốn phân lớp vào khoa.
            </small>
          </div>

          <div className="classes-modal__footer">
            <button
              type="button"
              className="classes-btn classes-btn--secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="classes-btn classes-btn--primary"
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : editingId !== null
                  ? "Lưu thay đổi"
                  : "Tạo lớp học"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )}
</div>


);
}
