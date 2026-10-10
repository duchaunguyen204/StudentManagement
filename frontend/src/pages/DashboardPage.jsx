
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  School,
  GraduationCap,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { api } from "../services/api";

function getArray(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function formatScore(score) {
  if (score === null || score === undefined || score === "") {
    return "—";
  }

  const number = Number(score);
  return Number.isFinite(number) ? number.toFixed(1) : "—";
}

export default function DashboardPage({ user, onNavigate }) {
  const isTeacher = user?.role === "Teacher";

  const [statistics, setStatistics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    // Sinh viên không tải dữ liệu tổng quan toàn hệ thống.
    if (!isTeacher) return;

    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.getStudentStatistics(),
        api.getClasses(),
        api.getGrades({ pageNumber: 1, pageSize: 5 }),
      ]);

      const errors = [];

      if (results[0].status === "fulfilled") {
        setStatistics(results[0].value);
      } else {
        setStatistics(null);
        errors.push("Không thể tải thống kê sinh viên.");
      }

      if (results[1].status === "fulfilled") {
        setClasses(getArray(results[1].value));
      } else {
        setClasses([]);
        errors.push("Không thể tải danh sách lớp học.");
      }

      if (results[2].status === "fulfilled") {
        setGrades(
          getArray(results[2].value?.items ?? results[2].value)
        );
      } else {
        setGrades([]);
        errors.push("Không thể tải bảng điểm gần đây.");
      }

      setError(errors.join(" "));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [isTeacher]);

  
useEffect(() => {
  if (!isTeacher) return;

  let active = true;

  async function fetchDashboard() {
    setError("");

    try {
      const results = await Promise.allSettled([
        api.getStudentStatistics(),
        api.getClasses(),
        api.getGrades({ pageNumber: 1, pageSize: 5 }),
      ]);

      if (!active) return;

      const errors = [];

      if (results[0].status === "fulfilled") {
        setStatistics(results[0].value);
      } else {
        setStatistics(null);
        errors.push("Không thể tải thống kê sinh viên.");
      }

      if (results[1].status === "fulfilled") {
        setClasses(getArray(results[1].value));
      } else {
        setClasses([]);
        errors.push("Không thể tải danh sách lớp học.");
      }

      if (results[2].status === "fulfilled") {
        setGrades(
          getArray(results[2].value?.items ?? results[2].value)
        );
      } else {
        setGrades([]);
        errors.push("Không thể tải bảng điểm gần đây.");
      }

      setError(errors.join(" "));
      setLastUpdated(new Date());
    } catch {
      if (active) {
        setError("Không thể tải dữ liệu tổng quan.");
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  fetchDashboard();

  return () => {
    active = false;
  };
}, [isTeacher]);

  // DASHBOARD SINH VIÊN
  // Không hiển thị thống kê hoặc dữ liệu toàn trường.
  if (!isTeacher) {
    return (
      <div className="teacher-dashboard">
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <span className="dashboard-eyebrow">
              STUDENTHUB · STUDENT PORTAL
            </span>

            <h2>
              Xin chào, {user?.username || "Sinh viên"}!
            </h2>

            <p>
              Chào mừng bạn đến với StudentHub.
              Bạn có thể truy cập bảng điểm để theo dõi
              kết quả học tập của mình.
            </p>

            <button
              type="button"
              className="dashboard-welcome-button"
              onClick={() => onNavigate("grades")}
            >
              Xem bảng điểm của tôi
              <ArrowRight size={17} />
            </button>
          </div>

          <div
            className="dashboard-welcome-art"
            aria-hidden="true"
          >
            <div className="dashboard-art-circle">
              <GraduationCap size={64} strokeWidth={1.5} />
            </div>

            <span className="dashboard-art-dot dot-one" />
            <span className="dashboard-art-dot dot-two" />
            <span className="dashboard-art-dot dot-three" />
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title-icon green">
              <BookOpen size={20} />
            </div>

            <div>
              <h3>Kết quả học tập</h3>
              <p>
                Tra cứu điểm các môn học của bạn.
              </p>
            </div>
          </div>

          <div className="dashboard-empty-state">
            <GraduationCap size={34} />

            <strong>Tra cứu bảng điểm</strong>

            <span>
              Nhấn nút bên dưới để xem kết quả học tập.
            </span>

            <button
              type="button"
              className="dashboard-welcome-button"
              onClick={() => onNavigate("grades")}
            >
              Đi đến bảng điểm
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <div className="dashboard-footer-note">
          <GraduationCap size={18} />
          <span>
            StudentHub — Theo dõi kết quả học tập của bạn.
          </span>
        </div>
      </div>
    );
  }

  // DASHBOARD GIÁO VIÊN
  const totalStudents = statistics?.totalStudents;
  const assignedStudents = statistics?.assignedStudents;
  const unassignedStudents = statistics?.unassignedStudents;

  const studentsByClass = Array.isArray(statistics?.studentsByClass)
    ? statistics.studentsByClass
    : [];

  const classCount = classes.length;
  const hasStatistics = statistics !== null;

  return (
    <div className="teacher-dashboard">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <span className="dashboard-eyebrow">
            STUDENTHUB · TEACHER PORTAL
          </span>

          <h2>
            Xin chào, {user?.username || "Giáo viên"}!
          </h2>

          <p>
            Theo dõi tình hình sinh viên, lớp học và kết quả học tập
            tại một nơi.
          </p>

          <button
            type="button"
            className="dashboard-welcome-button"
            onClick={() => onNavigate("students")}
          >
            Quản lý sinh viên
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="dashboard-welcome-art" aria-hidden="true">
          <div className="dashboard-art-circle">
            <GraduationCap size={64} strokeWidth={1.5} />
          </div>
          <span className="dashboard-art-dot dot-one" />
          <span className="dashboard-art-dot dot-two" />
          <span className="dashboard-art-dot dot-three" />
        </div>
      </section>

      {error && (
        <div className="dashboard-alert" role="alert">
          <AlertCircle size={19} />
          <div>
            <strong>Một số dữ liệu chưa tải được</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="dashboard-section-heading">
        <div>
          <h2>Tổng quan hệ thống</h2>
          <p>Các chỉ số được lấy từ dữ liệu hiện có.</p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "dashboard-spinning" : ""}
          />
          Làm mới
        </button>
      </div>

      <section className="dashboard-stat-grid">
        <StatCard
          title="Tổng sinh viên"
          value={totalStudents}
          icon={<Users size={22} />}
          tone="blue"
          loading={loading && !hasStatistics}
        />

        <StatCard
          title="Đã xếp lớp"
          value={assignedStudents}
          icon={<UserCheck size={22} />}
          tone="green"
          loading={loading && !hasStatistics}
        />

        <StatCard
          title="Chưa xếp lớp"
          value={unassignedStudents}
          icon={<UserX size={22} />}
          tone="orange"
          loading={loading && !hasStatistics}
        />

        <StatCard
          title="Tổng số lớp"
          value={classCount}
          icon={<School size={22} />}
          tone="purple"
          loading={loading}
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title-icon blue">
              <School size={20} />
            </div>

            <div>
              <h3>Sinh viên theo lớp</h3>
              <p>Phân bố số lượng sinh viên của từng lớp</p>
            </div>

            <span className="dashboard-panel-count">
              {studentsByClass.length} lớp
            </span>
          </div>

          {loading && !hasStatistics ? (
            <div className="dashboard-empty-state">
              Đang tải thống kê...
            </div>
          ) : studentsByClass.length === 0 ? (
            <div className="dashboard-empty-state">
              <School size={30} />
              <strong>Chưa có dữ liệu phân bố</strong>
              <span>
                Dữ liệu sẽ xuất hiện khi API thống kê trả về danh sách lớp.
              </span>
            </div>
          ) : (
            <div className="dashboard-class-list">
              {studentsByClass.map((item, index) => {
                const count = Number(item.studentCount ?? 0);
                const total = Number(totalStudents ?? 0);
                const percentage =
                  total > 0
                    ? Math.min(100, (count / total) * 100)
                    : 0;

                return (
                  <div
                    className="dashboard-class-item"
                    key={item.id ?? item.classId ?? item.classCode ?? index}
                  >
                    <div className="dashboard-class-top">
                      <div className="dashboard-class-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="dashboard-class-info">
                        <strong>
                          {item.className || item.tenLop || "Chưa có tên lớp"}
                        </strong>
                        <span>
                          {item.classCode || item.maLop || "Lớp học"}
                        </span>
                      </div>

                      <div className="dashboard-class-count">
                        <strong>{count}</strong>
                        <span>sinh viên</span>
                      </div>
                    </div>

                    <div
                      className="dashboard-progress-track"
                      role="progressbar"
                      aria-valuenow={Math.round(percentage)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Tỷ lệ sinh viên của ${
                        item.className || item.tenLop || "lớp"
                      }`}
                    >
                      <div
                        className="dashboard-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="dashboard-progress-label">
                      <span>Tỷ lệ trên tổng sinh viên</span>
                      <strong>{percentage.toFixed(1)}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-panel dashboard-quick-panel">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title-icon purple">
              <BookOpen size={20} />
            </div>

            <div>
              <h3>Truy cập nhanh</h3>
              <p>Các chức năng dành cho giáo viên</p>
            </div>
          </div>

          <QuickAction
            icon={<Users size={19} />}
            title="Quản lý sinh viên"
            description="Tìm kiếm, thêm và cập nhật sinh viên"
            onClick={() => onNavigate("students")}
          />

          <QuickAction
            icon={<BookOpen size={19} />}
            title="Bảng điểm"
            description="Xem và cập nhật kết quả học tập"
            onClick={() => onNavigate("grades")}
          />

          <div className="dashboard-info-box">
            <div className="dashboard-info-icon">
              <CheckCircle2 size={19} />
            </div>
            <div>
              <strong>Trạng thái hệ thống</strong>
              <p>
                {error
                  ? "Một số dữ liệu chưa thể tải."
                  : "Bạn có thể sử dụng các chức năng được cấp quyền."}
              </p>
            </div>
          </div>

          {lastUpdated && (
            <div className="dashboard-last-updated">
              <Clock3 size={14} />
              Cập nhật lúc{" "}
              {lastUpdated.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panel dashboard-grades-panel">
        <div className="dashboard-panel-heading">
          <div className="dashboard-panel-title-icon green">
            <GraduationCap size={20} />
          </div>

          <div>
            <h3>Bảng điểm gần đây</h3>
            <p>Các bản ghi được trả về từ API bảng điểm</p>
          </div>

          <button
            type="button"
            className="dashboard-text-button"
            onClick={() => onNavigate("grades")}
          >
            Xem bảng điểm <ArrowRight size={15} />
          </button>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Môn học</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="dashboard-table-empty">
                    {loading
                      ? "Đang tải bảng điểm..."
                      : "Chưa có bản ghi bảng điểm để hiển thị."}
                  </td>
                </tr>
              ) : (
                grades.map((grade, index) => {
                  const score =
                    grade.score === "" || grade.score == null
                      ? null
                      : Number(grade.score);

                  const studentName =
                    grade.studentName ||
                    grade.fullName ||
                    grade.student?.fullName ||
                    grade.student?.name ||
                    "Sinh viên";

                  return (
                    <tr key={grade.id ?? index}>
                      <td>
                        <div className="dashboard-student-cell">
                          <span className="dashboard-student-avatar">
                            {studentName.charAt(0).toUpperCase()}
                          </span>
                          <strong>{studentName}</strong>
                        </div>
                      </td>

                      <td>
                        {grade.subjectName ||
                          grade.subject?.name ||
                          grade.subject ||
                          "—"}
                      </td>

                      <td>
                        <span className="dashboard-score">
                          {formatScore(score)}
                        </span>
                      </td>

                      <td>
                        {score === null ? (
                          <span className="dashboard-status neutral">
                            Chưa có điểm
                          </span>
                        ) : score >= 5 ? (
                          <span className="dashboard-status passed">
                            Đạt
                          </span>
                        ) : (
                          <span className="dashboard-status failed">
                            Chưa đạt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dashboard-footer-note">
        <GraduationCap size={18} />
        <span>
          StudentHub — Quản lý đào tạo và theo dõi kết quả học tập.
        </span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, tone, loading }) {
  return (
    <article className={`dashboard-stat-card ${tone}`}>
      <div className="dashboard-stat-top">
        <span>{title}</span>
        <div className="dashboard-stat-icon">{icon}</div>
      </div>

      <div className="dashboard-stat-value">
        {loading ? (
          <span className="dashboard-value-loading">...</span>
        ) : value == null ? (
          "—"
        ) : (
          Number(value).toLocaleString("vi-VN")
        )}
      </div>

      <div className="dashboard-stat-caption">
        Dữ liệu hệ thống
      </div>
    </article>
  );
}

function QuickAction({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      className="dashboard-quick-action"
      onClick={onClick}
    >
      <span className="dashboard-quick-icon">{icon}</span>

      <span className="dashboard-quick-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <ArrowRight size={17} className="dashboard-quick-arrow" />
    </button>
  );
}