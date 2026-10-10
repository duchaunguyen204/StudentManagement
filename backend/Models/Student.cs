namespace StudentManagement.Api.Models;

public class Student
{
    public int Id { get; set; }

    public string StudentCode { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public int? ClassId { get; set; }

    public Class? Class { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public ICollection<Grade> Grades { get; set; }
        = new List<Grade>();
}