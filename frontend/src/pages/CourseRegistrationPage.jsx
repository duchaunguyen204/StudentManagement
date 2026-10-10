
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function CourseRegistrationPage() {
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busySubjectId, setBusySubjectId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const [available, mine] = await Promise.all([
        api.getAvailableSubjects(),
        api.getMyCourseRegistrations(),
      ]);

      setAvailableSubjects(Array.isArray(available) ? available : []);
      setRegistrations(Array.isArray(mine) ? mine : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách môn học.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialData() {
      try {
        const [available, mine] = await Promise.all([
          api.getAvailableSubjects(),
          api.getMyCourseRegistrations(),
        ]);

        if (cancelled) return;

        setAvailableSubjects(Array.isArray(available) ? available : []);
        setRegistrations(Array.isArray(mine) ? mine : []);
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Không thể tải danh sách môn học.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return availableSubjects;

    return availableSubjects.filter((subject) =>
      `${subject.subjectCode} ${subject.subjectName}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [availableSubjects, search]);

  const totalCredits = registrations.reduce(
    (total, item) => total + (item.credits || 0),
    0
  );

  async function handleRegister(subject) {
    setBusySubjectId(subject.id);
    setError("");
    setMessage("");

    try {
      const result = await api.registerSubject(subject.id);
      setMessage(result?.message || "Đăng ký môn học thành công.");
      await loadData();
    } catch (err) {
      setError(err.message || "Đăng ký môn học thất bại.");
    } finally {
      setBusySubjectId(null);
    }
  }

  async function handleCancel(subjectId) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy đăng ký môn học này không?"
    );

    if (!confirmed) return;

    setBusySubjectId(subjectId);
    setError("");
    setMessage("");

    try {
      const result = await api.cancelSubjectRegistration(subjectId);
      setMessage(result?.message || "Hủy đăng ký thành công.");
      await loadData();
    } catch (err) {
      setError(err.message || "Không thể hủy đăng ký môn học.");
    } finally {
      setBusySubjectId(null);
    }
  }

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
  };

  const buttonStyle = {
    border: 0,
    borderRadius: 8,
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: 600,
  };

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("vi-VN");
  }

  return (
    <div style={{ display: "grid", gap: 24, color: "#111827" }}>
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>
          Đăng ký môn học
        </h2>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Chọn môn học muốn đăng ký và quản lý danh sách môn đã chọn.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            borderRadius: 8,
            color: "#b91c1c",
            background: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            padding: 12,
            borderRadius: 8,
            color: "#166534",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Môn đã đăng ký
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>
            {registrations.length}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Tổng tín chỉ
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>
            {totalCredits}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Môn có thể đăng ký
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>
            {availableSubjects.length}
          </div>
        </div>
      </div>

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 19 }}>
            Danh sách môn học
          </h3>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã môn hoặc tên môn..."
            aria-label="Tìm môn học"
            style={{
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              width: "min(100%, 320px)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {loading ? (
          <p>Đang tải danh sách môn học...</p>
        ) : filteredSubjects.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {availableSubjects.length === 0
              ? "Bạn đã đăng ký tất cả môn học hiện có hoặc chưa có môn học nào."
              : "Không tìm thấy môn học phù hợp."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 520,
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={cellStyle}>Mã môn</th>
                  <th style={cellStyle}>Tên môn học</th>
                  <th style={cellStyle}>Tín chỉ</th>
                  <th style={cellStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td style={cellStyle}>{subject.subjectCode}</td>
                    <td style={cellStyle}>{subject.subjectName}</td>
                    <td style={cellStyle}>{subject.credits}</td>
                    <td style={cellStyle}>
                      <button
                        type="button"
                        disabled={busySubjectId === subject.id}
                        onClick={() => handleRegister(subject)}
                        style={{
                          ...buttonStyle,
                          color: "#fff",
                          background: "#2563eb",
                          opacity:
                            busySubjectId === subject.id ? 0.6 : 1,
                        }}
                      >
                        {busySubjectId === subject.id
                          ? "Đang xử lý..."
                          : "Đăng ký"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: 19 }}>
          Môn học đã đăng ký
        </h3>

        {loading ? (
          <p>Đang tải danh sách đăng ký...</p>
        ) : registrations.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            Bạn chưa đăng ký môn học nào.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 620,
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={cellStyle}>Mã môn</th>
                  <th style={cellStyle}>Tên môn học</th>
                  <th style={cellStyle}>Tín chỉ</th>
                  <th style={cellStyle}>Ngày đăng ký</th>
                  <th style={cellStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item) => (
                  <tr key={item.id}>
                    <td style={cellStyle}>{item.subjectCode}</td>
                    <td style={cellStyle}>{item.subjectName}</td>
                    <td style={cellStyle}>{item.credits}</td>
                    <td style={cellStyle}>
                      {formatDate(item.registeredAt)}
                    </td>
                    <td style={cellStyle}>
                      <button
                        type="button"
                        disabled={busySubjectId === item.subjectId}
                        onClick={() => handleCancel(item.subjectId)}
                        style={{
                          ...buttonStyle,
                          color: "#b91c1c",
                          background: "#fee2e2",
                          opacity:
                            busySubjectId === item.subjectId ? 0.6 : 1,
                        }}
                      >
                        {busySubjectId === item.subjectId
                          ? "Đang xử lý..."
                          : "Hủy đăng ký"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            ...buttonStyle,
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
          }}
        >
          Làm mới danh sách
        </button>
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  verticalAlign: "middle",
};