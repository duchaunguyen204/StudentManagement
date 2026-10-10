using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class UpdateStudentDto
{
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


}
