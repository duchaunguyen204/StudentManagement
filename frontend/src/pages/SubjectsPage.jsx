
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { api } from "../services/api";

const EMPTY_FORM = {
  subjectCode: "",
  subjectName: "",
  credits: 3,
};

const PAGE_SIZE = 8;

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "Đã xảy ra lỗi. Vui lòng thử lại."
  );
}

function normalizeSubjects(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  if (Array.isArray(result?.data?.items)) {
    return result.data.items;
  }

  return [];
}

export default function SubjectsPage({ userRole = "Teacher" }) {
  const isAdmin = userRole === "Admin";
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  // Tải danh sách môn học
  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api.getSubjects(search);
      const list = normalizeSubjects(result);

      setSubjects(list);
      setPage(1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Tự động tải danh sách khi mở trang hoặc thay đổi từ khóa
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSubjects();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadSubjects]);

  // Mở form thêm mới
  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setError("");
    setNotice("");
    setShowForm(true);
  }

  // Mở form chỉnh sửa
  function openEditForm(subject) {
    setEditingId(subject.id);

    setForm({
      subjectCode: subject.subjectCode ?? "",
      subjectName: subject.subjectName ?? "",
      credits: subject.credits ?? 3,
    });

    setFormError("");
    setError("");
    setNotice("");
    setShowForm(true);
  }

  // Đóng form
  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
  }

  // Cập nhật dữ liệu trong form
  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // Kiểm tra dữ liệu nhập
  function validateForm() {
    const subjectCode = form.subjectCode.trim();
    const subjectName = form.subjectName.trim();
    const credits = Number(form.credits);

    if (!subjectCode) {
      return "Vui lòng nhập mã môn học.";
    }

    if (subjectCode.length > 20) {
      return "Mã môn học không được vượt quá 20 ký tự.";
    }

    if (!subjectName) {
      return "Vui lòng nhập tên môn học.";
    }

    if (subjectName.length > 100) {
      return "Tên môn học không được vượt quá 100 ký tự.";
    }

    if (!Number.isInteger(credits) || credits < 1 || credits > 10) {
      return "Số tín chỉ phải là số nguyên từ 1 đến 10.";
    }

    return "";
  }

  // Thêm mới hoặc cập nhật môn học
  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const data = {
      subjectCode: form.subjectCode.trim(),
      subjectName: form.subjectName.trim(),
      credits: Number(form.credits),
    };

    setSaving(true);
    setFormError("");
    setError("");
    setNotice("");

    try {
      if (editingId !== null) {
        await api.updateSubject(editingId, data);
        setNotice("Cập nhật môn học thành công.");
      } else {
        await api.createSubject(data);
        setNotice("Thêm môn học thành công.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadSubjects();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Mở hộp thoại xác nhận xóa
  function openDeleteDialog(subject) {
    setDeleteTarget(subject);
    setError("");
    setNotice("");
  }

  // Hủy xóa
  function closeDeleteDialog() {
    if (deleting) return;

    setDeleteTarget(null);
  }

  // Xóa môn học
  async function handleDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await api.deleteSubject(deleteTarget.id);

      setDeleteTarget(null);
      setNotice("Xóa môn học thành công.");

      await loadSubjects();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  // Làm mới danh sách
  function handleRefresh() {
    setNotice("");
    setError("");
    void loadSubjects();
  }

  // Tính toán phân trang
  const totalPages = Math.max(
    1,
    Math.ceil(subjects.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const currentSubjects = subjects.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const firstItem = subjects.length === 0 ? 0 : startIndex + 1;

  const lastItem = Math.min(
    startIndex + PAGE_SIZE,
    subjects.length
  );

  return (
    <div className="subjects-page">
      {/* Tiêu đề trang */}
      <div className="subjects-page__header">
        <div className="subjects-page__heading">
          <div className="subjects-page__icon">
            <BookOpen size={26} />
          </div>

          <div>
            <p>Quản lý danh sách môn học và số tín chỉ trong hệ thống.</p>
          </div>
        </div>

        <div className="subjects-page__header-actions">
          <button
            type="button"
            className="subjects-btn subjects-btn--secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "subjects-spin" : ""}
            />
            Làm mới
          </button>

          {isAdmin && (
            <button
              type="button"
              className="subjects-btn subjects-btn--primary"
              onClick={openCreateForm}
            >
              <Plus size={18} />
              Thêm môn học
            </button>
          )}
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="subjects-alert subjects-alert--error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Đóng thông báo lỗi"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          className="subjects-alert subjects-alert--success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Đóng thông báo"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Thẻ thống kê */}
      <div className="subjects-stats">
        <div className="subjects-stat-card">
          <div className="subjects-stat-card__icon">
            <BookOpen size={23} />
          </div>

          <div>
            <span className="subjects-stat-card__label">
              Tổng số môn học
            </span>

            <strong className="subjects-stat-card__value">
              {subjects.length}
            </strong>
          </div>
        </div>

        <div className="subjects-stat-card">
          <div className="subjects-stat-card__icon subjects-stat-card__icon--purple">
            <GraduationCap size={24} />
          </div>

          <div>
            <span className="subjects-stat-card__label">
              Tổng số tín chỉ
            </span>

            <strong className="subjects-stat-card__value">
              {subjects.reduce(
                (total, subject) =>
                  total + (Number(subject.credits) || 0),
                0
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* Danh sách môn học */}
      <section className="subjects-panel">
        <div className="subjects-panel__toolbar">
          <div>
            <h2>Danh sách môn học</h2>
            <p>Tra cứu và quản lý thông tin các môn học.</p>
          </div>

          <div className="subjects-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên môn học..."
              aria-label="Tìm kiếm môn học"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="subjects-table-wrapper">
          <table className="subjects-table">
            <thead>
              <tr>
                <th className="subjects-table__number">STT</th>
                <th>Mã môn học</th>
                <th>Tên môn học</th>
                <th className="subjects-table__credits">Tín chỉ</th>
                {isAdmin && <th className="subjects-table__actions">Thao tác</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="subjects-table__empty">
                    <RefreshCw size={22} className="subjects-spin" />
                    <span>Đang tải danh sách môn học...</span>
                  </td>
                </tr>
              ) : currentSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="subjects-table__empty">
                    <BookOpen size={28} />
                    <strong>Không tìm thấy môn học</strong>
                    <span>
                      {search
                        ? "Hãy thử từ khóa khác."
                        : "Bạn có thể thêm môn học mới."}
                    </span>
                  </td>
                </tr>
              ) : (
                currentSubjects.map((subject, index) => (
                  <tr key={subject.id}>
                    <td className="subjects-table__number">
                      {startIndex + index + 1}
                    </td>

                    <td>
                      <span className="subjects-code">
                        {subject.subjectCode}
                      </span>
                    </td>

                    <td>
                      <div className="subjects-name">
                        <div className="subjects-name__icon">
                          <BookOpen size={17} />
                        </div>

                        <span>{subject.subjectName}</span>
                      </div>
                    </td>

                    <td className="subjects-table__credits">
                      <span className="subjects-credit-badge">
                        {subject.credits} tín chỉ
                      </span>
                    </td>

                    {isAdmin && <td className="subjects-table__actions">
                      <div className="subjects-row-actions">
                        <button
                          type="button"
                          className="subjects-icon-btn subjects-icon-btn--edit"
                          onClick={() => openEditForm(subject)}
                          title="Chỉnh sửa môn học"
                          aria-label={`Sửa môn ${subject.subjectName}`}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="subjects-icon-btn subjects-icon-btn--delete"
                          onClick={() => openDeleteDialog(subject)}
                          title="Xóa môn học"
                          aria-label={`Xóa môn ${subject.subjectName}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="subjects-pagination">
          <span className="subjects-pagination__info">
            Hiển thị {firstItem}–{lastItem} trong tổng số{" "}
            {subjects.length} môn học
          </span>

          <div className="subjects-pagination__controls">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1 || loading}
            >
              Trước
            </button>

            <span>
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              disabled={currentPage >= totalPages || loading}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {/* Form thêm mới / chỉnh sửa */}
      {isAdmin && showForm && (
        <div
          className="subjects-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="subjects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subjects-form-title"
          >
            <div className="subjects-modal__header">
              <div>
                <h2 id="subjects-form-title">
                  {editingId !== null
                    ? "Chỉnh sửa môn học"
                    : "Thêm môn học"}
                </h2>

                <p>
                  Nhập đầy đủ thông tin môn học bên dưới.
                </p>
              </div>

              <button
                type="button"
                className="subjects-modal__close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Đóng biểu mẫu"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div
                  className="subjects-alert subjects-alert--error"
                  role="alert"
                >
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="subjects-form-group">
                <label htmlFor="subjectCode">
                  Mã môn học <span>*</span>
                </label>

                <input
                  id="subjectCode"
                  name="subjectCode"
                  type="text"
                  value={form.subjectCode}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: IT101"
                  maxLength={20}
                  required
                  disabled={saving}
                />
              </div>

              <div className="subjects-form-group">
                <label htmlFor="subjectName">
                  Tên môn học <span>*</span>
                </label>

                <input
                  id="subjectName"
                  name="subjectName"
                  type="text"
                  value={form.subjectName}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Lập trình cơ bản"
                  maxLength={100}
                  required
                  disabled={saving}
                />
              </div>

              <div className="subjects-form-group">
                <label htmlFor="credits">
                  Số tín chỉ <span>*</span>
                </label>

                <input
                  id="credits"
                  name="credits"
                  type="number"
                  value={form.credits}
                  onChange={handleFormChange}
                  min={1}
                  max={10}
                  step={1}
                  required
                  disabled={saving}
                />

                <small>Nhập số tín chỉ từ 1 đến 10.</small>
              </div>

              <div className="subjects-modal__footer">
                <button
                  type="button"
                  className="subjects-btn subjects-btn--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="subjects-btn subjects-btn--primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="subjects-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      {editingId !== null
                        ? "Lưu thay đổi"
                        : "Thêm môn học"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Hộp thoại xác nhận xóa */}
      {isAdmin && deleteTarget && (
        <div
          className="subjects-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <section
            className="subjects-modal subjects-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="subjects-delete-title"
          >
            <div className="subjects-confirm-icon">
              <Trash2 size={25} />
            </div>

            <h2 id="subjects-delete-title">
              Xác nhận xóa môn học
            </h2>

            <p>
              Bạn có chắc chắn muốn xóa môn học{" "}
              <strong>{deleteTarget.subjectName}</strong>{" "}
              ({deleteTarget.subjectCode}) không?
            </p>

            <p className="subjects-confirm-warning">
              Nếu môn học đã có điểm hoặc dữ liệu liên quan, hệ thống
              có thể từ chối thao tác xóa.
            </p>

            <div className="subjects-modal__footer">
              <button
                type="button"
                className="subjects-btn subjects-btn--secondary"
                onClick={closeDeleteDialog}
                disabled={deleting}
              >
                Hủy
              </button>

              <button
                type="button"
                className="subjects-btn subjects-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={17} className="subjects-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Xóa môn học
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

