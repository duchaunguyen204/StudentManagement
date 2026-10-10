using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class CreateStudentDto
{
[Required(ErrorMessage = "Mã sinh viên không được để trống.")]
[StringLength(20, MinimumLength = 2,
ErrorMessage = "Mã sinh viên phải có từ 2 đến 20 ký tự.")]
[RegularExpression(@"^[a-zA-Z0-9_-]+$",
ErrorMessage = "Mã sinh viên chỉ được chứa chữ cái, chữ số, dấu gạch ngang và gạch dưới.")]
public string StudentCode { get; set; } = string.Empty;


[Required(ErrorMessage = "Họ tên không được để trống.")]
[StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự.")]
[RegularExpression(@"^[\p{L}\p{M}][\p{L}\p{M}\s]*$",
    ErrorMessage = "Họ tên chỉ được chứa chữ cái và khoảng trắng.")]
public string FullName { get; set; } = string.Empty;

[Required(ErrorMessage = "Email không được để trống.")]
[EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
[StringLength(100, ErrorMessage = "Email không được vượt quá 100 ký tự.")]
public string Email { get; set; } = string.Empty;

[Range(1, int.MaxValue,
    ErrorMessage = "ClassId phải lớn hơn 0.")]
public int? ClassId { get; set; }

[Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
[StringLength(50, MinimumLength = 3,
    ErrorMessage = "Tên đăng nhập phải có từ 3 đến 50 ký tự.")]
[RegularExpression(@"^[a-zA-Z0-9_.-]+$",
    ErrorMessage = "Tên đăng nhập chỉ được chứa chữ cái không dấu, chữ số, dấu chấm, gạch ngang và gạch dưới.")]
public string Username { get; set; } = string.Empty;

[Required(ErrorMessage = "Mật khẩu không được để trống.")]
[StringLength(100, MinimumLength = 8,
    ErrorMessage = "Mật khẩu phải có từ 8 đến 100 ký tự.")]
public string Password { get; set; } = string.Empty;


}
