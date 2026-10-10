
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import GradeTable from "../components/GradeTable";

export default function GradesPage({
  grades = [],
  isTeacher = false,
  loading = false,
  error = "",
  notice = "",
  totalCount = 0,
  pageNumber = 1,
  pageSize = 10,
  search = "",
  onSearchChange,
  setSearch,
  onSearch,
  onSearchSubmit,
  onPageChange,
  setPageNumber,
  editingId,
  editingScore,
  savingId,
  onEdit,
  onScoreChange,
  onSave,
  onCancel,
  onRefresh,
  onNotice,
  onError,
}) {
  const [options, setOptions] = useState({
    students: [],
    subjects: [],
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [newScore, setNewScore] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const updateSearch = onSearchChange || setSearch;
  const submitSearch = onSearch || onSearchSubmit;
  const changePage = onPageChange || setPageNumber;

  const total = Math.max(0, Number(totalCount) || 0);
  const currentPage = Math.max(1, Number(pageNumber) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(total / size));

  const displayFrom =
    total === 0 ? 0 : (currentPage - 1) * size + 1;
  const displayTo = Math.min(currentPage * size, total);

  const pageButtons = useMemo(() => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  // Tải danh sách sinh viên và môn học cho biểu mẫu thêm điểm
  useEffect(() => {
    if (!isTeacher) return;

    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);

      try {
        const result = await api.getGradeOptions();

        if (active) {
          setOptions({
            students: result?.students ?? [],
            subjects: result?.subjects ?? [],
          });
        }
      } catch (err) {
        if (active) {
          onError?.(
            err.message || "Không thể tải danh sách sinh viên và môn học."
          );
        }
      } finally {
        if (active) setOptionsLoading(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [isTeacher, onError]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    submitSearch?.(search);
  }

  function handleClearSearch() {
    updateSearch?.("");
    submitSearch?.("");
  }

  function goToPage(page) {
    if (
      typeof changePage === "function" &&
      page >= 1 &&
      page <= totalPages &&
      page !== currentPage
    ) {
      changePage(page);
    }
  }

  function resetCreateForm() {
    setStudentId("");
    setSubjectId("");
    setNewScore("");
    setShowCreateForm(false);
  }

  async function handleCreateGrade(event) {
    event.preventDefault();

    const score = Number(newScore);

    if (!studentId || !subjectId) {
      onError?.("Vui lòng chọn sinh viên và môn học.");
      return;
    }

    if (
      newScore.trim() === "" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 10
    ) {
      onError?.("Điểm phải là số từ 0 đến 10.");
      return;
    }

    setCreating(true);

    try {
      await api.createGrade({
        studentId,
        subjectId,
        score,
      });

      resetCreateForm();
      onError?.("");
      onNotice?.("Thêm điểm thành công.");
      onRefresh?.();
    } catch (err) {
      onError?.(err.message || "Không thể thêm điểm.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteGrade(grade) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa điểm của ${grade.studentName || "sinh viên"} ` +
      `môn ${grade.subjectName || "đã chọn"} không?`
    );

    if (!confirmed) return;

    setDeletingId(grade.id);

    try {
      await api.deleteGrade(grade.id);

      onError?.("");
      onNotice?.("Xóa điểm thành công.");
      onRefresh?.();
    } catch (err) {
      onError?.(err.message || "Không thể xóa điểm.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="grades-page">
      <section className="grades-heading">
        <div className="grades-heading-content">
          <h1>Bảng điểm</h1>
          <p className="grades-description">
            {isTeacher
              ? "Tra cứu, thêm, sửa và xóa điểm sinh viên."
              : "Theo dõi điểm số các môn học và kết quả học tập của bạn."}
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            className="grades-button grades-button-primary"
            onClick={() => setShowCreateForm((value) => !value)}
            disabled={creating || optionsLoading}
          >
            {showCreateForm ? "Đóng biểu mẫu" : "+ Thêm điểm"}
          </button>
        )}
      </section>

      {isTeacher && showCreateForm && (
        <section className="grades-toolbar">
          <div className="grades-toolbar-heading">
            <h2>Thêm điểm sinh viên</h2>
            <p>Chọn sinh viên, môn học và nhập điểm từ 0 đến 10.</p>
          </div>

          <form
            className="grades-search-form"
            onSubmit={handleCreateGrade}
          >
            <label className="grades-search-box">
              <select
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                required
                disabled={creating || optionsLoading}
                aria-label="Chọn sinh viên"
              >
                <option value="">-- Chọn sinh viên --</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.studentCode} - {student.fullName}
                    {student.className ? ` (${student.className})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="grades-search-box">
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                required
                disabled={creating || optionsLoading}
                aria-label="Chọn môn học"
              >
                <option value="">-- Chọn môn học --</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subjectCode} - {subject.subjectName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grades-search-box">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={newScore}
                onChange={(event) => setNewScore(event.target.value)}
                placeholder="Nhập điểm (0–10)"
                aria-label="Điểm sinh viên"
                required
                disabled={creating}
              />
            </label>

            <button
              type="submit"
              className="grades-button grades-button-primary"
              disabled={creating || optionsLoading}
            >
              {creating ? "Đang thêm..." : "Lưu điểm"}
            </button>

            <button
              type="button"
              className="grades-button grades-button-secondary"
              onClick={resetCreateForm}
              disabled={creating}
            >
              Hủy
            </button>

            {!optionsLoading &&
              options.students.length === 0 && (
                <p>Chưa có sinh viên để chọn.</p>
              )}

            {!optionsLoading &&
              options.subjects.length === 0 && (
                <p>Chưa có môn học để chọn.</p>
              )}
          </form>
        </section>
      )}

      <section className="grades-info-grid">
        <article className="grades-info-card">
          <div className="grades-info-icon grades-icon-blue">▤</div>
          <div className="grades-info-content">
            <p className="grades-info-label">Tổng bản ghi</p>
            <p className="grades-info-value">
              {total.toLocaleString("vi-VN")}
            </p>
          </div>
        </article>

        <article className="grades-info-card">
          <div className="grades-info-icon grades-icon-green">↔</div>
          <div className="grades-info-content">
            <p className="grades-info-label">Bản ghi trên trang</p>
            <p className="grades-info-value">{grades.length}</p>
          </div>
        </article>

        <article className="grades-info-card">
          <div className="grades-info-icon grades-icon-purple">#</div>
          <div className="grades-info-content">
            <p className="grades-info-label">Trang hiện tại</p>
            <p className="grades-info-value">
              {currentPage} / {totalPages}
            </p>
          </div>
        </article>
      </section>

      <section className="grades-toolbar">
        <div className="grades-toolbar-heading">
          <h2>Danh sách kết quả học tập</h2>
          <p>Tìm kiếm theo thông tin được hỗ trợ từ hệ thống.</p>
        </div>

        <form className="grades-search-form" onSubmit={handleSearchSubmit}>
          <label className="grades-search-box">
            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch?.(event.target.value)}
              placeholder="Nhập nội dung cần tìm..."
              aria-label="Tìm kiếm bảng điểm"
            />
          </label>

          <button
            className="grades-button grades-button-primary"
            type="submit"
            disabled={loading}
          >
            Tìm kiếm
          </button>

          <button
            className="grades-button grades-button-secondary"
            type="button"
            onClick={handleClearSearch}
            disabled={loading}
          >
            Xóa tìm kiếm
          </button>
        </form>
      </section>

      {error && (
        <div className="grades-alert grades-alert-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="grades-alert grades-alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="grades-table-container">
        <GradeTable
          grades={grades}
          isTeacher={isTeacher}
          loading={loading}
          editingId={editingId}
          editingScore={editingScore}
          savingId={savingId}
          deletingId={deletingId}
          onEdit={onEdit}
          onScoreChange={onScoreChange}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={handleDeleteGrade}
        />
      </div>

      <section className="grades-pagination-card">
        <p className="grades-range-text">
          Hiển thị <strong>{displayFrom}</strong> –{" "}
          <strong>{displayTo}</strong> trong{" "}
          <strong>{total.toLocaleString("vi-VN")}</strong> bản ghi
        </p>

        <nav className="grades-pagination" aria-label="Phân trang bảng điểm">
          <button
            type="button"
            className="grades-page-button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            aria-label="Trang trước"
          >
            ‹
          </button>

          {pageButtons.length > 0 && pageButtons[0] > 1 && (
            <>
              <button
                type="button"
                className="grades-page-button"
                onClick={() => goToPage(1)}
                disabled={loading}
              >
                1
              </button>
              {pageButtons[0] > 2 && (
                <span className="grades-page-ellipsis">…</span>
              )}
            </>
          )}

          {pageButtons.map((page) => (
            <button
              key={page}
              type="button"
              className={`grades-page-button ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => goToPage(page)}
              disabled={loading}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          {pageButtons.length > 0 &&
            pageButtons[pageButtons.length - 1] < totalPages && (
              <>
                {pageButtons[pageButtons.length - 1] < totalPages - 1 && (
                  <span className="grades-page-ellipsis">…</span>
                )}
                <button
                  type="button"
                  className="grades-page-button"
                  onClick={() => goToPage(totalPages)}
                  disabled={loading}
                >
                  {totalPages}
                </button>
              </>
            )}

          <button
            type="button"
            className="grades-page-button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            aria-label="Trang tiếp"
          >
            ›
          </button>
        </nav>
      </section>

      <footer className="grades-footer">
        <span>StudentHub · Quản lý kết quả học tập</span>
        <span>
          {isTeacher
            ? "Quyền thao tác được kiểm tra ở backend."
            : "Bạn đang xem kết quả học tập của mình."}
        </span>
      </footer>
    </main>
  );
}