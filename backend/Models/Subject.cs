namespace StudentManagement.Api.Models;

public class Subject
{
    public int Id { get; set; }

    public string SubjectCode { get; set; } = string.Empty;

    public string SubjectName { get; set; } = string.Empty;

    public int Credits { get; set; }

    public ICollection<Grade> Grades { get; set; }
        = new List<Grade>();
}