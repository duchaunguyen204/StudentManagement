
export default function Sidebar({
    user,
    activePage,
    onNavigate,
    onLogout,
}) {
    const isTeacher = user?.role === "Teacher" || user?.role === "Admin";
    const isAdmin = user?.role === "Admin";
    const isStudent = user?.role === "Student";

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-brand">
                <div className="brand-icon small">S</div>

                <div>
                    <strong>StudentHub</strong>
                    <span>QUẢN LÝ HỌC TẬP</span>
                </div>
            </div>

            {/* Menu chính */}
            <p className="menu-heading">MENU CHÍNH</p>

            {/* Tổng quan */}
            <button
                type="button"
                className={`menu-item ${
                    activePage === "dashboard" ? "active" : ""
                }`}
                onClick={() => onNavigate("dashboard")}
            >
                <span>▦</span>
                Tổng quan
            </button>

            {/* Bảng điểm */}
            <button
                type="button"
                className={`menu-item ${
                    activePage === "grades" ? "active" : ""
                }`}
                onClick={() => onNavigate("grades")}
            >
                <span>▤</span>
                Bảng điểm
            </button>

            {/* Chức năng chỉ dành cho sinh viên */}
            {isStudent && (
                <button
                    type="button"
                    className={`menu-item ${
                        activePage === "course-registration" ? "active" : ""
                    }`}
                    onClick={() => onNavigate("course-registration")}
                >
                    <span>📚</span>
                    Đăng ký môn học
                </button>
            )}

            {/* Chức năng chỉ dành cho Admin */}
            {isAdmin && (
                <button
                    type="button"
                    className={`menu-item ${activePage === "teachers" ? "active" : ""}`}
                    onClick={() => onNavigate("teachers")}
                >
                    <span>♙</span>
                    Quản lý giáo viên
                </button>
            )}

            {/* Các chức năng của giáo viên */}
            {isTeacher && (
                <>
                    {/* Quản lý sinh viên */}
                    <button
                        type="button"
                        className={`menu-item ${
                            activePage === "students" ? "active" : ""
                        }`}
                        onClick={() => onNavigate("students")}
                    >
                        <span>♙</span>
                        Quản lý sinh viên
                    </button>

                    {/* Quản lý môn học */}
                    <button
                        type="button"
                        className={`menu-item ${
                            activePage === "subjects" ? "active" : ""
                        }`}
                        onClick={() => onNavigate("subjects")}
                    >
                        <span>▧</span>
                        Quản lý môn học
                    </button>

                    {/* Quản lý khoa */}
                    <button
                        type="button"
                        className={`menu-item ${
                            activePage === "faculties" ? "active" : ""
                        }`}
                        onClick={() => onNavigate("faculties")}
                    >
                        <span>🏢</span>
                        Quản lý khoa
                    </button>

                    {/* Quản lý lớp */}
                    <button
                        type="button"
                        className={`menu-item ${
                            activePage === "classes" ? "active" : ""
                        }`}
                        onClick={() => onNavigate("classes")}
                    >
                        <span>▤</span>
                        Quản lý lớp
                    </button>
                </>
            )}

            {/* Tài khoản và đăng xuất */}
            <div className="sidebar-bottom">
                <div className="profile-avatar">
                    {(user?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div className="profile-info">
                    <strong>{user?.username || "Người dùng"}</strong>
                    <span>
                        {user?.role === "Admin" ? "Quản trị viên" : isTeacher ? "Giáo viên" : "Sinh viên"}
                    </span>
                </div>

                <button
                    type="button"
                    className="logout-button"
                    onClick={onLogout}
                    title="Đăng xuất"
                    aria-label="Đăng xuất"
                >
                    ↪
                </button>
            </div>
        </aside>
    );
}