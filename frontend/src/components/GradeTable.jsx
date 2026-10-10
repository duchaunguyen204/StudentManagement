
export default function GradeTable({
  grades = [],
  isTeacher = false,
  loading = false,
  editingId,
  editingScore,
  savingId,
  deletingId,
  onEdit,
  onScoreChange,
  onSave,
  onCancel,
  onDelete,
}) {
  const columnCount = isTeacher ? 6 : 5;

  const score = Number(editingScore);
  const validScore =
    String(editingScore ?? "").trim() !== "" &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 10;

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Sinh viên</th>
            <th>Lớp</th>
            <th>Môn học</th>
            <th>Điểm</th>
            <th>Giáo viên</th>
            {isTeacher && <th>Thao tác</th>}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columnCount} className="empty-cell">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : grades.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="empty-cell">
                Không có dữ liệu điểm.
              </td>
            </tr>
          ) : (
            grades.map((grade) => {
              const isEditing =
                isTeacher && editingId === grade.id;
              const isSaving = savingId === grade.id;
              const isDeleting = deletingId === grade.id;
              const currentScore = Number(grade.score);

              return (
                <tr key={grade.id}>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar">
                        {(grade.studentName || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <strong>{grade.studentName}</strong>
                        <span>{grade.studentCode}</span>
                      </div>
                    </div>
                  </td>

                  <td>{grade.className || "—"}</td>

                  <td>
                    <div className="subject-cell">
                      <strong>{grade.subjectName}</strong>
                      <span>{grade.subjectCode}</span>
                    </div>
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        className="score-input"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={editingScore}
                        onChange={(event) =>
                          onScoreChange?.(event.target.value)
                        }
                        disabled={isSaving}
                        aria-label="Điểm mới"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`score-badge ${
                          currentScore >= 5 ? "passed" : "failed"
                        }`}
                      >
                        {Number.isFinite(currentScore)
                          ? currentScore.toFixed(2)
                          : "—"}
                      </span>
                    )}
                  </td>

                  <td>{grade.teacherName || "—"}</td>

                  {isTeacher && (
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="save-button"
                            disabled={!validScore || isSaving}
                            onClick={() => onSave?.(grade.id)}
                          >
                            {isSaving ? "Đang lưu..." : "Lưu"}
                          </button>

                          <button
                            type="button"
                            className="cancel-button"
                            disabled={isSaving}
                            onClick={onCancel}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="edit-button"
                            disabled={savingId != null || deletingId != null}
                            onClick={() => onEdit?.(grade)}
                          >
                            Sửa điểm
                          </button>

                          <button
                            type="button"
                            className="cancel-button"
                            disabled={savingId != null || deletingId != null}
                            onClick={() => onDelete?.(grade)}
                          >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}