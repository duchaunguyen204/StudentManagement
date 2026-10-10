using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Teacher,Admin")]
public class FacultiesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FacultiesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetFaculties(
        [FromQuery] string? search)
    {
        var query = _context.Faculties
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();

            query = query.Where(f =>
                f.FacultyCode.Contains(keyword) ||
                f.FacultyName.Contains(keyword));
        }

        var faculties = await query
            .OrderBy(f => f.FacultyCode)
            .Select(f => new
            {
                f.Id,
                f.FacultyCode,
                f.FacultyName,
                ClassCount = f.Classes.Count()
            })
            .ToListAsync();

        return Ok(faculties);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetFaculty(int id)
    {
        var faculty = await _context.Faculties
            .AsNoTracking()
            .Where(f => f.Id == id)
            .Select(f => new
            {
                f.Id,
                f.FacultyCode,
                f.FacultyName,
                ClassCount = f.Classes.Count()
            })
            .FirstOrDefaultAsync();

        if (faculty == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy khoa."
            });
        }

        return Ok(faculty);
    }

    [HttpPost]
        [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateFaculty(
        [FromBody] Faculty dto)
    {
        var code = dto.FacultyCode.Trim();
        var name = dto.FacultyName.Trim();

        if (string.IsNullOrWhiteSpace(code) ||
            string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Mã khoa và tên khoa không được để trống."
            });
        }

        if (code.Length > 20 || name.Length > 100)
        {
            return BadRequest(new
            {
                message = "Mã khoa tối đa 20 ký tự, tên khoa tối đa 100 ký tự."
            });
        }

        if (await _context.Faculties.AnyAsync(
            f => f.FacultyCode == code))
        {
            return Conflict(new
            {
                message = "Mã khoa đã tồn tại."
            });
        }

        var faculty = new Faculty
        {
            FacultyCode = code,
            FacultyName = name
        };

        _context.Faculties.Add(faculty);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Không thể tạo khoa. Hãy kiểm tra mã khoa."
            });
        }

        return CreatedAtAction(
            nameof(GetFaculty),
            new { id = faculty.Id },
            faculty);
    }

    [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateFaculty(
        int id,
        [FromBody] Faculty dto)
    {
        var faculty = await _context.Faculties
            .FirstOrDefaultAsync(f => f.Id == id);

        if (faculty == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy khoa."
            });
        }

        var code = dto.FacultyCode.Trim();
        var name = dto.FacultyName.Trim();

        if (string.IsNullOrWhiteSpace(code) ||
            string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Mã khoa và tên khoa không được để trống."
            });
        }

        if (code.Length > 20 || name.Length > 100)
        {
            return BadRequest(new
            {
                message = "Mã khoa tối đa 20 ký tự, tên khoa tối đa 100 ký tự."
            });
        }

        if (await _context.Faculties.AnyAsync(
            f => f.FacultyCode == code && f.Id != id))
        {
            return Conflict(new
            {
                message = "Mã khoa đã được sử dụng."
            });
        }

        faculty.FacultyCode = code;
        faculty.FacultyName = name;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Không thể cập nhật thông tin khoa."
            });
        }

        return Ok(new
        {
            message = "Cập nhật khoa thành công.",
            faculty.Id,
            faculty.FacultyCode,
            faculty.FacultyName
        });
    }

    [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteFaculty(int id)
    {
        var faculty = await _context.Faculties
            .Include(f => f.Classes)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (faculty == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy khoa."
            });
        }

        if (faculty.Classes.Count > 0)
        {
            return Conflict(new
            {
                message = "Không thể xóa khoa vì vẫn còn lớp học thuộc khoa này."
            });
        }

        _context.Faculties.Remove(faculty);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Không thể xóa khoa do dữ liệu đang có liên kết."
            });
        }

        return Ok(new
        {
            message = "Xóa khoa thành công.",
            id
        });
    }
}

