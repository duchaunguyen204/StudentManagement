namespace StudentManagement.Api.Models;

public class CourseRegistration
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public Student? Student { get; set; }

    public int SubjectId { get; set; }

    public Subject? Subject { get; set; }

    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}