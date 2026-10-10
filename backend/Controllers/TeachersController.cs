using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.DTOs;
using StudentManagement.Api.Models;
using StudentManagement.Api.Services;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class TeachersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public TeachersController(AppDbContext context, PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeachers([FromQuery] string? search)
    {
        var query = _context.Teachers.AsNoTracking().Include(t => t.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(t => t.TeacherCode.Contains(keyword) ||
                                     t.FullName.Contains(keyword) ||
                                     t.Email.Contains(keyword) ||
                                     t.User!.Username.Contains(keyword));
        }

        var teachers = await query.OrderBy(t => t.TeacherCode)
            .Select(t => new
            {
                t.Id,
                t.TeacherCode,
                t.FullName,
                t.Email,
                t.UserId,
                Username = t.User!.Username,
                GradeCount = t.Grades.Count
            }).ToListAsync();
        return Ok(teachers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTeacher(int id)
    {
        var teacher = await _context.Teachers.AsNoTracking().Include(t => t.User)
            .Where(t => t.Id == id)
            .Select(t => new { t.Id, t.TeacherCode, t.FullName, t.Email, t.UserId, Username = t.User!.Username, GradeCount = t.Grades.Count })
            .FirstOrDefaultAsync();
        return teacher == null ? NotFound(new { message = "Không tìm thấy giáo viên." }) : Ok(teacher);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTeacher([FromBody] CreateTeacherDto dto)
    {
        var code = dto.TeacherCode.Trim();
        var name = dto.FullName.Trim();
        var email = dto.Email.Trim();
        var username = dto.Username.Trim();

        if (await _context.Teachers.AnyAsync(t => t.TeacherCode == code))
            return Conflict(new { message = "Mã giáo viên đã tồn tại." });
        if (await _context.Teachers.AnyAsync(t => t.Email == email))
            return Conflict(new { message = "Email giáo viên đã tồn tại." });
        if (await _context.Users.AnyAsync(u => u.Username == username))
            return Conflict(new { message = "Tên đăng nhập đã tồn tại." });

        var user = new User { Username = username, Role = "Teacher" };
        user.PasswordHash = _passwordService.HashPassword(user, dto.Password);
        var teacher = new Teacher { TeacherCode = code, FullName = name, Email = email, User = user };

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Users.Add(user);
            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();
            return Conflict(new { message = "Không thể tạo giáo viên. Hãy kiểm tra mã, email và tên đăng nhập có bị trùng không." });
        }

        return CreatedAtAction(nameof(GetTeacher), new { id = teacher.Id }, new
        {
            teacher.Id, teacher.TeacherCode, teacher.FullName, teacher.Email,
            Username = user.Username, teacher.UserId
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTeacher(int id, [FromBody] UpdateTeacherDto dto)
    {
        var teacher = await _context.Teachers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (teacher == null) return NotFound(new { message = "Không tìm thấy giáo viên." });

        var code = dto.TeacherCode.Trim();
        var name = dto.FullName.Trim();
        var email = dto.Email.Trim();
        var username = dto.Username.Trim();

        if (await _context.Teachers.AnyAsync(t => t.Id != id && t.TeacherCode == code))
            return Conflict(new { message = "Mã giáo viên đã được sử dụng." });
        if (await _context.Teachers.AnyAsync(t => t.Id != id && t.Email == email))
            return Conflict(new { message = "Email giáo viên đã được sử dụng." });
        if (await _context.Users.AnyAsync(u => u.Id != teacher.UserId && u.Username == username))
            return Conflict(new { message = "Tên đăng nhập đã được sử dụng." });

        teacher.TeacherCode = code;
        teacher.FullName = name;
        teacher.Email = email;
        teacher.User!.Username = username;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = "Không thể cập nhật giáo viên. Hãy kiểm tra dữ liệu trùng." }); }

        return Ok(new { message = "Cập nhật giáo viên thành công." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTeacher(int id)
    {
        var teacher = await _context.Teachers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (teacher == null) return NotFound(new { message = "Không tìm thấy giáo viên." });

        if (await _context.Grades.AnyAsync(g => g.TeacherId == id))
            return Conflict(new { message = "Không thể xóa giáo viên vì giáo viên đang được liên kết với bảng điểm. Hãy xử lý các bản ghi điểm liên quan trước." });

        var user = teacher.User;
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Teachers.Remove(teacher);
            await _context.SaveChangesAsync();
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
            await transaction.CommitAsync();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();
            return Conflict(new { message = "Không thể xóa giáo viên do còn dữ liệu liên quan." });
        }
        return Ok(new { message = "Xóa giáo viên và tài khoản đăng nhập thành công." });
    }
}
