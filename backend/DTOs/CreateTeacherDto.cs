using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class CreateTeacherDto
{
    [Required, StringLength(20, MinimumLength = 2)]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Mã giáo viên chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.")]
    public string TeacherCode { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 3)]
    [RegularExpression(@"^[a-zA-Z0-9_.-]+$", ErrorMessage = "Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.")]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}
