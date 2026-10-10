using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Teacher,Admin")]
public class SubjectsController : ControllerBase
{
private readonly AppDbContext _context;


public SubjectsController(AppDbContext context)
{
    _context = context;
}

// GET: api/Subjects?search=database
[HttpGet]
public async Task<IActionResult> GetSubjects(
    [FromQuery] string? search = null)
{
    var query = _context.Subjects.AsNoTracking();

    if (!string.IsNullOrWhiteSpace(search))
    {
        var keyword = search.Trim();

        query = query.Where(s =>
            s.SubjectCode.Contains(keyword) ||
            s.SubjectName.Contains(keyword));
    }

    var subjects = await query
        .OrderBy(s => s.SubjectCode)
        .Select(s => new
        {
            s.Id,
            s.SubjectCode,
            s.SubjectName,
            s.Credits,
            GradeCount = s.Grades.Count
        })
        .ToListAsync();

    return Ok(subjects);
}

// GET: api/Subjects/1
[HttpGet("{id:int}")]
public async Task<IActionResult> GetSubject(int id)
{
    var subject = await _context.Subjects
        .AsNoTracking()
        .Where(s => s.Id == id)
        .Select(s => new
        {
            s.Id,
            s.SubjectCode,
            s.SubjectName,
            s.Credits,
            GradeCount = s.Grades.Count
        })
        .FirstOrDefaultAsync();

    if (subject == null)
    {
        return NotFound(new
        {
            message = "Không tìm thấy môn học."
        });
    }

    return Ok(subject);
}

// POST: api/Subjects
[HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSubject(
    [FromBody] SubjectRequestDto dto)
{
    var validationError = ValidateSubject(dto);

    if (validationError != null)
    {
        return BadRequest(new { message = validationError });
    }

    var code = dto.SubjectCode.Trim();
    var name = dto.SubjectName.Trim();

    var codeExists = await _context.Subjects
        .AnyAsync(s => s.SubjectCode == code);

    if (codeExists)
    {
        return Conflict(new
        {
            message = "Mã môn học đã tồn tại."
        });
    }

    var subject = new Subject
    {
        SubjectCode = code,
        SubjectName = name,
        Credits = dto.Credits
    };

    _context.Subjects.Add(subject);
    await _context.SaveChangesAsync();

    return CreatedAtAction(
        nameof(GetSubject),
        new { id = subject.Id },
        new
        {
            message = "Thêm môn học thành công.",
            subject.Id,
            subject.SubjectCode,
            subject.SubjectName,
            subject.Credits
        });
}

// PUT: api/Subjects/1
[HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSubject(
    int id,
    [FromBody] SubjectRequestDto dto)
{
    var validationError = ValidateSubject(dto);

    if (validationError != null)
    {
        return BadRequest(new { message = validationError });
    }

    var subject = await _context.Subjects
        .FirstOrDefaultAsync(s => s.Id == id);

    if (subject == null)
    {
        return NotFound(new
        {
            message = "Không tìm thấy môn học."
        });
    }

    var code = dto.SubjectCode.Trim();
    var name = dto.SubjectName.Trim();

    var codeExists = await _context.Subjects
        .AnyAsync(s =>
            s.Id != id &&
            s.SubjectCode == code);

    if (codeExists)
    {
        return Conflict(new
        {
            message = "Mã môn học đã được sử dụng."
        });
    }

    subject.SubjectCode = code;
    subject.SubjectName = name;
    subject.Credits = dto.Credits;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Cập nhật môn học thành công.",
        subject.Id,
        subject.SubjectCode,
        subject.SubjectName,
        subject.Credits
    });
}

// DELETE: api/Subjects/1
[HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSubject(int id)
{
    var subject = await _context.Subjects
        .FirstOrDefaultAsync(s => s.Id == id);

    if (subject == null)
    {
        return NotFound(new
        {
            message = "Không tìm thấy môn học."
        });
    }

    var hasGrades = await _context.Grades
        .AnyAsync(g => g.SubjectId == id);

    if (hasGrades)
    {
        return Conflict(new
        {
            message =
                "Không thể xóa môn học đã có bảng điểm liên quan."
        });
    }

    _context.Subjects.Remove(subject);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Xóa môn học thành công."
    });
}

private static string? ValidateSubject(
    SubjectRequestDto dto)
{
    if (string.IsNullOrWhiteSpace(dto.SubjectCode))
    {
        return "Mã môn học không được để trống.";
    }

    if (dto.SubjectCode.Trim().Length > 50)
    {
        return "Mã môn học không được vượt quá 50 ký tự.";
    }

    if (string.IsNullOrWhiteSpace(dto.SubjectName))
    {
        return "Tên môn học không được để trống.";
    }

    if (dto.SubjectName.Trim().Length > 200)
    {
        return "Tên môn học không được vượt quá 200 ký tự.";
    }

    if (dto.Credits < 1 || dto.Credits > 30)
    {
        return "Số tín chỉ phải nằm trong khoảng từ 1 đến 30.";
    }

    return null;
}


}

public class SubjectRequestDto
{
public string SubjectCode { get; set; } = string.Empty;


public string SubjectName { get; set; } = string.Empty;

public int Credits { get; set; }


}
