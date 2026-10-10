
namespace StudentManagement.Api.DTOs;

public class GradeResponseDto
{
    public int Id { get; set; }

    public string StudentCode { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public string ClassName { get; set; } = string.Empty;

    public string SubjectCode { get; set; } = string.Empty;

    public string SubjectName { get; set; } = string.Empty;

    public decimal Score { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }
}