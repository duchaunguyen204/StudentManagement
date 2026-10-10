namespace StudentManagement.Api.Models;

public class Teacher
{
    public int Id { get; set; }

    public string TeacherCode { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public int UserId { get; set; }

    public User? User { get; set; }

    public ICollection<Grade> Grades { get; set; }
        = new List<Grade>();
}