
namespace StudentManagement.Api.Models;

public class Faculty
{
    public int Id { get; set; }

    public string FacultyCode { get; set; } = string.Empty;

    public string FacultyName { get; set; } = string.Empty;

    public ICollection<Class> Classes { get; set; }
        = new List<Class>();
}

