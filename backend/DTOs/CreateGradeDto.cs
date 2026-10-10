
using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class CreateGradeDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn sinh viên.")]
    public int StudentId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn môn học.")]
    public int SubjectId { get; set; }

    [Range(typeof(decimal), "0", "10",
        ErrorMessage = "Điểm phải nằm trong khoảng từ 0 đến 10.")]
    public decimal Score { get; set; }
}