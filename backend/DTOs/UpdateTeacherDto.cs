using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class UpdateTeacherDto
{
    [Required, StringLength(20, MinimumLength = 2)]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$")]
    public string TeacherCode { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 3)]
    [RegularExpression(@"^[a-zA-Z0-9_.-]+$")]
    public string Username { get; set; } = string.Empty;
}
