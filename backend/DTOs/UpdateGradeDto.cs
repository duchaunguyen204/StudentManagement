
using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Api.DTOs;

public class UpdateGradeDto
{
    [Range(0, 10, ErrorMessage = "Điểm phải nằm trong khoảng 0 đến 10.")]
    public decimal Score { get; set; }
}