
import { useEffect, useState } from "react";
import { api } from "./services/api";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import GradesPage from "./pages/GradesPage";
import StudentsPage from "./pages/StudentsPage";
import SubjectsPage from "./pages/SubjectsPage";
import FacultiesPage from "./pages/FacultiesPage";
import ClassesPage from "./pages/ClassesPage";
import CourseRegistrationPage from "./pages/CourseRegistrationPage";
import TeachersPage from "./pages/TeachersPage";

import "./App.css";

export default function App() {
  // Thông tin đăng nhập
  const [user, setUser] = useState(null);
  const [checkingLogin, setCheckingLogin] = useState(true);

  // Điều hướng trang
  const [activePage, setActivePage] = useState("dashboard");

  // Dữ liệu bảng điểm
  const [grades, setGrades] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tìm kiếm bảng điểm
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  // Trạng thái giao diện bảng điểm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Chỉnh sửa điểm
  const [editingId, setEditingId] = useState(null);
  const [editingScore, setEditingScore] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Tổng số trang bảng điểm
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  // Kiểm tra phiên đăng nhập
  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const data = await api.getMe();

        if (active) {
          setUser(data);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setCheckingLogin(false);
        }
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, []);

  // Tải bảng điểm khi người dùng đăng nhập
  // Không cập nhật state đồng bộ khi user chưa tồn tại.
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let active = true;

    async function fetchGrades() {
      setLoading(true);
      setError("");

      try {
        const result = await api.getGrades({
          pageNumber,
          pageSize,
          search: submittedSearch,
        });

        if (!active) return;

        setGrades(result.items ?? []);
        setTotalCount(result.totalCount ?? 0);
      } catch (err) {
        if (!active) return;

        setError(
          err.message || "Không thể tải bảng điểm."
        );

        setGrades([]);
        setTotalCount(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchGrades();

    return () => {
      active = false;
    };
  }, [
    user,
    pageNumber,
    pageSize,
    submittedSearch,
    refreshKey,
  ]);

  // Chuyển trang và kiểm tra quyền
  function handleNavigate(page) {
    const isTeacher = user?.role === "Teacher" || user?.role === "Admin";
    const isStudent = user?.role === "Student";

    const adminPages = ["teachers"];

    const teacherPages = [
      "students",
      "subjects",
      "faculties",
      "classes",
    ];

    const allowedPages = [
      "dashboard",
      "grades",
      "students",
      "subjects",
      "faculties",
      "classes",
      "course-registration",
      "teachers",
    ];

    if (!allowedPages.includes(page)) {
      return;
    }

    if (teacherPages.includes(page) && !isTeacher) {
      return;
    }

    if (adminPages.includes(page) && user?.role !== "Admin") {
      return;
    }

    if (page === "course-registration" && !isStudent) {
      return;
    }

    setActivePage(page);
    setError("");
    setNotice("");
    setEditingId(null);
    setEditingScore("");
  }

  // Đăng xuất
  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Vẫn đăng xuất khỏi giao diện nếu API gặp lỗi.
    }

    setUser(null);
    setGrades([]);
    setTotalCount(0);
    setActivePage("dashboard");
    setPageNumber(1);
    setSearch("");
    setSubmittedSearch("");
    setEditingId(null);
    setEditingScore("");
    setSavingId(null);
    setLoading(false);
    setError("");
    setNotice("");
  }

  // Tìm kiếm bảng điểm
  function handleSearch(event) {
    event.preventDefault();

    setPageNumber(1);
    setSubmittedSearch(search.trim());
    setNotice("");
    setError("");
  }

  // Bắt đầu sửa điểm
  function handleEdit(grade) {
    setEditingId(grade.id);
    setEditingScore(String(grade.score));
    setError("");
    setNotice("");
  }

  // Lưu điểm mới
  async function handleSave(id) {
    const score = Number(editingScore);

    if (
      editingScore.trim() === "" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 10
    ) {
      setError("Điểm phải là số từ 0 đến 10.");
      return;
    }

    setSavingId(id);
    setError("");
    setNotice("");

    try {
      await api.updateGrade(id, score);

      setEditingId(null);
      setEditingScore("");
      setNotice("Cập nhật điểm thành công.");
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      setError(
        err.message || "Không thể cập nhật điểm."
      );
    } finally {
      setSavingId(null);
    }
  }

  // Đang kiểm tra đăng nhập
  if (checkingLogin) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const isTeacher = user.role === "Teacher" || user.role === "Admin";
  const isStudent = user.role === "Student";

  // Tiêu đề trang
  const pageTitles = {
    dashboard: "Tổng quan",
    grades: "Bảng điểm",
    students: "Quản lý sinh viên",
    subjects: "Quản lý môn học",
    faculties: "Quản lý khoa",
    classes: "Quản lý lớp",
    "course-registration": "Đăng ký môn học",
    teachers: "Quản lý giáo viên",
  };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Header
          title={pageTitles[activePage] || "Tổng quan"}
          user={user}
        />

        {/* Trang tổng quan */}
        {activePage === "dashboard" && (
          <>
            {isTeacher && error && (
              <div className="alert error">
                {error}
              </div>
            )}

            <DashboardPage
              user={user}
              grades={grades}
              totalCount={totalCount}
              onNavigate={handleNavigate}
            />
          </>
        )}

        {/* Trang bảng điểm */}
        {activePage === "grades" && (
          <GradesPage
            user={user}
            isTeacher={isTeacher}
            onRefresh={() =>
              setRefreshKey((previous) => previous + 1)
            }
            onNotice={setNotice}
            onError={setError}
            grades={grades}
            totalCount={totalCount}
            pageNumber={pageNumber}
            totalPages={totalPages}
            search={search}
            loading={loading}
            error={error}
            notice={notice}
            editingId={editingId}
            editingScore={editingScore}
            savingId={savingId}
            onSearchChange={setSearch}
            onSearch={handleSearch}
            onPageChange={setPageNumber}
            onEdit={handleEdit}
            onScoreChange={setEditingScore}
            onSave={handleSave}
            onCancel={() => {
              setEditingId(null);
              setEditingScore("");
              setError("");
            }}
          />
        )}

        {/* Quản lý môn học */}
        {activePage === "subjects" && isTeacher && (
          <SubjectsPage userRole={user.role} />
        )}

        {/* Quản lý sinh viên */}
        {activePage === "students" && isTeacher && (
          <StudentsPage userRole={user.role} />
        )}

        {/* Quản lý khoa */}
        {activePage === "faculties" && isTeacher && (
          <FacultiesPage userRole={user.role} />
        )}

        {/* Quản lý lớp */}
        {activePage === "classes" && isTeacher && (
          <ClassesPage userRole={user.role} />
        )}

        {/* Quản lý giáo viên: chỉ Admin được truy cập */}
        {activePage === "teachers" && user.role === "Admin" && (
          <TeachersPage />
        )}

        {/* Đăng ký môn học */}
        {activePage === "course-registration" && isStudent && (
          <CourseRegistrationPage />
        )}

        <footer className="page-footer">
          StudentHub · Hệ thống quản lý học tập
        </footer>
      </main>
    </div>
  );
}