namespace StudentManagement.Api.Models;

public class Grade
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public Student? Student { get; set; }

    public int SubjectId { get; set; }

    public Subject? Subject { get; set; }

    public int TeacherId { get; set; }

    public Teacher? Teacher { get; set; }

    public decimal Score { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}