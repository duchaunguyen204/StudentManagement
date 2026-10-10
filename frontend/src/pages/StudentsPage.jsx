
import { useEffect, useState } from "react";
import { api } from "../services/api";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
    studentCode: "",
    fullName: "",
    email: "",
    classId: "",
    username: "",
    password: "",
};

export default function StudentsPage({ userRole = "Teacher" }) {
    // Teacher chỉ được tra cứu; chỉ Admin được thêm, sửa và xóa sinh viên.
    const isAdmin = userRole === "Admin";
    // ==================== STATE ====================

    const [students, setStudents] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [classes, setClasses] = useState([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Thay đổi giá trị này để yêu cầu tải lại dữ liệu.
    const [refreshKey, setRefreshKey] = useState(0);

    // ==================== TẢI DANH SÁCH SINH VIÊN ====================

    useEffect(() => {
        let cancelled = false;

        async function fetchStudents() {
            try {
                const result = await api.getStudents({
                    page,
                    pageSize: PAGE_SIZE,
                    search: submittedSearch,
                });

                if (cancelled) return;

                // Đọc đúng cấu trúc JSON của backend.
                const studentData = Array.isArray(result?.data)
                    ? result.data
                    : [];

                const itemCount = Number(result?.totalItems ?? 0);
                const pageCount = Math.max(
                    1,
                    Number(result?.totalPages ?? 1)
                );

                // Nếu dữ liệu thay đổi làm trang hiện tại không còn tồn tại,
                // chuyển về trang cuối hợp lệ.
                if (page > pageCount) {
                    setPage(pageCount);
                    return;
                }

                setStudents(studentData);
                setTotalItems(itemCount);
                setTotalPages(pageCount);
            } catch (err) {
                if (cancelled) return;

                setStudents([]);
                setTotalItems(0);
                setTotalPages(1);
                setError(
                    err.message || "Không thể tải danh sách sinh viên."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchStudents();

        return () => {
            cancelled = true;
        };
    }, [page, submittedSearch, refreshKey]);

    // ==================== TẢI THỐNG KÊ VÀ DANH SÁCH LỚP ====================


    useEffect(() => {
        let cancelled = false;

        async function fetchStatisticsAndClasses() {
            try {
                const result = await api.getStudentStatistics();

                console.log("Dữ liệu thống kê:", result);

                if (!cancelled) {
                    setStatistics(result);
                }
            } catch (err) {
                console.error("Lỗi tải thống kê:", err);
            }

            try {
                const result = await api.getClasses();

                if (!cancelled) {
                    const classData = Array.isArray(result)
                        ? result
                        : Array.isArray(result?.data)
                            ? result.data
                            : [];

                    setClasses(classData);
                }
            } catch (err) {
                console.error("Lỗi tải danh sách lớp:", err);
            }
        }

        fetchStatisticsAndClasses();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);



    // ==================== XỬ LÝ BIỂU MẪU ====================

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleAdd() {
        setEditingStudent(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
        setError("");
        setNotice("");
    }

    function handleEdit(student) {
        setEditingStudent(student);

        setForm({
            studentCode: student.studentCode ?? "",
            fullName: student.fullName ?? "",
            email: student.email ?? "",
            classId:
                student.classId == null
                    ? ""
                    : String(student.classId),
            username: "",
            password: "",
        });

        setShowForm(true);
        setError("");
        setNotice("");
    }

    function handleCancel() {
        if (saving) return;

        setShowForm(false);
        setEditingStudent(null);
        setForm({ ...EMPTY_FORM });
    }

    // ==================== THÊM / CẬP NHẬT SINH VIÊN ====================

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        setError("");
        setNotice("");

        const fullName = form.fullName.trim();
        const email = form.email.trim();

        if (!fullName) {
            setError("Vui lòng nhập họ và tên.");
            return;
        }

        if (!email) {
            setError("Vui lòng nhập email.");
            return;
        }

        if (!editingStudent) {
            if (!form.studentCode.trim()) {
                setError("Vui lòng nhập mã sinh viên.");
                return;
            }

            if (!form.username.trim()) {
                setError("Vui lòng nhập tên đăng nhập.");
                return;
            }

            if (form.password.length < 8) {
                setError("Mật khẩu phải có ít nhất 8 ký tự.");
                return;
            }
        }

        const classId =
            form.classId === "" ? null : Number(form.classId);

        if (
            classId !== null &&
            (!Number.isInteger(classId) || classId < 1)
        ) {
            setError("Vui lòng chọn lớp học hợp lệ.");
            return;
        }

        const studentData = {
            fullName,
            email,
            classId,
        };

        setSaving(true);

        try {
            if (editingStudent) {
                // DTO cập nhật chỉ gồm FullName, Email và ClassId.
                await api.updateStudent(
                    editingStudent.id,
                    studentData
                );

                setNotice("Cập nhật sinh viên thành công.");
            } else {
                // DTO tạo mới gồm cả thông tin tài khoản.
                await api.createStudent({
                    studentCode: form.studentCode.trim(),
                    ...studentData,
                    username: form.username.trim(),
                    password: form.password,
                });

                setNotice("Thêm sinh viên thành công.");
                setPage(1);
                setSearch("");
                setSubmittedSearch("");
            }

            setShowForm(false);
            setEditingStudent(null);
            setForm({ ...EMPTY_FORM });

            // Tải lại danh sách và thống kê sau khi lưu.
            setLoading(true);
            setRefreshKey((previous) => previous + 1);
        } catch (err) {
            setError(
                err.message || "Không thể lưu thông tin sinh viên."
            );
        } finally {
            setSaving(false);
        }
    }

    // ==================== XÓA SINH VIÊN ====================

    async function handleDelete(student) {
        if (deletingId !== null) return;

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa sinh viên "${student.fullName}" không?`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");
        setDeletingId(student.id);

        try {
            await api.deleteStudent(student.id);

            setNotice("Xóa sinh viên thành công.");
            setLoading(true);

            // Nếu xóa bản ghi cuối cùng trên trang hiện tại,
            // chuyển về trang trước.
            if (students.length === 1 && page > 1) {
                setPage((previous) => previous - 1);
            } else {
                setRefreshKey((previous) => previous + 1);
            }
        } catch (err) {
            setError(
                err.message ||
                "Không thể xóa sinh viên. Hãy kiểm tra xem sinh viên có bảng điểm hay không."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // ==================== TÌM KIẾM ====================

    function handleSearch(event) {
        event.preventDefault();

        setError("");
        setNotice("");
        setLoading(true);
        setPage(1);
        setSubmittedSearch(search.trim());
    }

    function handlePageChange(nextPage) {
        if (
            nextPage < 1 ||
            nextPage > totalPages ||
            nextPage === page ||
            loading
        ) {
            return;
        }

        setError("");
        setNotice("");
        setLoading(true);
        setPage(nextPage);
    }

    // ==================== GIAO DIỆN ====================

    return (
        <section className="students-page">
            {/* Tiêu đề */}
            <div className="students-heading">
                <div>

                    <p>
                        Quản lý thông tin, lớp học và tài khoản sinh viên.
                    </p>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        className="students-primary-button"
                        onClick={handleAdd}
                        disabled={saving}
                    >
                        + Thêm sinh viên
                    </button>
                )}
            </div>

            {/* Thông báo */}
            {error && (
                <div className="alert error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <div className="alert success" role="status">
                    {notice}
                </div>
            )}

            {/* Thống kê */}
            <div className="students-statistics">
                <div className="students-stat-card">
                    <span>Tổng sinh viên</span>
                    <strong>
                        {statistics?.totalStudents ?? "—"}
                    </strong>
                </div>

                <div className="students-stat-card">
                    <span>Đã xếp lớp</span>
                    <strong>
                        {statistics?.assignedStudents ?? "—"}
                    </strong>
                </div>

                <div className="students-stat-card">
                    <span>Chưa xếp lớp</span>
                    <strong>
                        {statistics?.unassignedStudents ?? "—"}
                    </strong>
                </div>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="students-toolbar">
                <form
                    className="students-search-form"
                    onSubmit={handleSearch}
                >
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm theo mã, tên hoặc email..."
                        aria-label="Tìm kiếm sinh viên"
                    />

                    <button
                        type="submit"
                        className="students-secondary-button"
                        disabled={loading}
                    >
                        Tìm kiếm
                    </button>
                </form>

                <span className="students-total">
                    Tổng cộng: <strong>{totalItems}</strong> sinh viên
                </span>
            </div>

            {/* Bảng sinh viên */}
            <div className="students-table-card">
                <div className="students-table-scroll">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Mã sinh viên</th>
                                <th>Họ và tên</th>
                                <th>Email</th>
                                <th>Lớp</th>
                                {isAdmin && <th>Thao tác</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="students-empty">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="students-empty">
                                        Không tìm thấy sinh viên nào.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <tr key={student.id}>
                                        <td>
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>

                                        <td>
                                            <span className="student-code-badge">
                                                {student.studentCode}
                                            </span>
                                        </td>

                                        <td className="student-name">
                                            {student.fullName}
                                        </td>

                                        <td>{student.email}</td>

                                        <td>
                                            {student.className || "Chưa xếp lớp"}
                                        </td>

                                        {isAdmin && (
                                            <td>
                                                <div className="student-action-group">
                                                    <button
                                                        type="button"
                                                        className="student-action-button edit"
                                                        onClick={() => handleEdit(student)}
                                                        disabled={deletingId !== null}
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="student-action-button delete"
                                                        onClick={() => handleDelete(student)}
                                                        disabled={deletingId !== null}
                                                    >
                                                        {deletingId === student.id
                                                            ? "Đang xóa..."
                                                            : "Xóa"}
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="students-pagination">
                    <span>
                        Trang {page} / {totalPages}
                    </span>

                    <div className="students-pagination-buttons">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            ← Trước
                        </button>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            Sau →
                        </button>
                    </div>
                </div>
            </div>

            {/* Biểu mẫu thêm / sửa */}
            {isAdmin && showForm && (
                <div className="students-modal-overlay">
                    <div
                        className="students-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="student-form-title"
                    >
                        <div className="students-modal-heading">
                            <div>
                                <h3 id="student-form-title">
                                    {editingStudent
                                        ? "Cập nhật sinh viên"
                                        : "Thêm sinh viên"}
                                </h3>

                                <p>
                                    {editingStudent
                                        ? "Chỉnh sửa thông tin sinh viên."
                                        : "Nhập thông tin để tạo sinh viên mới."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="students-modal-close"
                                onClick={handleCancel}
                                disabled={saving}
                                aria-label="Đóng biểu mẫu"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="students-form"
                            onSubmit={handleSubmit}
                        >
                            {!editingStudent && (
                                <>
                                    <div className="students-form-field">
                                        <label htmlFor="studentCode">
                                            Mã sinh viên *
                                        </label>

                                        <input
                                            id="studentCode"
                                            name="studentCode"
                                            value={form.studentCode}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: SV0003"
                                            required
                                            minLength={2}
                                            maxLength={20}
                                            pattern="[A-Za-z0-9_-]+"
                                            title="Mã sinh viên chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới."
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="students-form-field">
                                        <label htmlFor="username">
                                            Tên đăng nhập *
                                        </label>

                                        <input
                                            id="username"
                                            name="username"
                                            value={form.username}
                                            onChange={handleChange}
                                            placeholder="Nhập tên đăng nhập"
                                            required
                                            minLength={3}
                                            maxLength={50}
                                            pattern="[A-Za-z0-9_-]+"
                                            title="Tên đăng nhập chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới."
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="students-form-field">
                                        <label htmlFor="password">
                                            Mật khẩu *
                                        </label>

                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Ít nhất 8 ký tự"
                                            required
                                            minLength={8}
                                            maxLength={100}
                                            disabled={saving}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="students-form-field">
                                <label htmlFor="fullName">
                                    Họ và tên *
                                </label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên"
                                    required
                                    maxLength={100}
                                    pattern="[A-Za-zÀ-ỹĐđ ]+"
                                    title="Vui lòng nhập họ tên bằng chữ và dấu cách."
                                    disabled={saving}
                                />
                            </div>

                            <div className="students-form-field">
                                <label htmlFor="email">Email *</label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    required
                                    maxLength={100}
                                    disabled={saving}
                                />
                            </div>

                            <div className="students-form-field">
                                <label htmlFor="classId">Lớp học</label>

                                <select
                                    id="classId"
                                    name="classId"
                                    value={form.classId}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="">Chưa xếp lớp</option>

                                    {classes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.classCode
                                                ? `${item.classCode} - ${item.className ?? item.tenLop ?? ""}`
                                                : item.className ?? item.tenLop ?? ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="students-form-actions">
                                <button
                                    type="button"
                                    className="students-secondary-button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="students-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : editingStudent
                                            ? "Lưu thay đổi"
                                            : "Tạo sinh viên"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

