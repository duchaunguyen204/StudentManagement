
namespace StudentManagement.Api.Models;

public class Class
{
    public int Id { get; set; }

    public string ClassCode { get; set; } = string.Empty;

    public string ClassName { get; set; } = string.Empty;

    public int? FacultyId { get; set; }

    public Faculty? Faculty { get; set; }

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}

