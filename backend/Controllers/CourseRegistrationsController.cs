
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class CourseRegistrationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CourseRegistrationsController(AppDbContext context)
    {
        _context = context;
    }

    // Tìm hồ sơ sinh viên từ User.Id trong cookie đăng nhập.
    private async Task<Student?> GetCurrentStudentAsync()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        return await _context.Students
            .SingleOrDefaultAsync(s => s.UserId == userId);
    }

    // GET: api/CourseRegistrations/available
    // Danh sách môn chưa đăng ký.
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableSubjects()
    {
        var student = await GetCurrentStudentAsync();

        if (student == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy hồ sơ sinh viên."
            });
        }

        var registeredSubjectIds = _context.CourseRegistrations
            .Where(r => r.StudentId == student.Id)
            .Select(r => r.SubjectId);

        var subjects = await _context.Subjects
            .AsNoTracking()
            .Where(s => !registeredSubjectIds.Contains(s.Id))
            .OrderBy(s => s.SubjectCode)
            .Select(s => new
            {
                s.Id,
                s.SubjectCode,
                s.SubjectName,
                s.Credits
            })
            .ToListAsync();

        return Ok(subjects);
    }

    // GET: api/CourseRegistrations/mine
    // Danh sách môn sinh viên hiện tại đã đăng ký.
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyRegistrations()
    {
        var student = await GetCurrentStudentAsync();

        if (student == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy hồ sơ sinh viên."
            });
        }

        var registrations = await _context.CourseRegistrations
            .AsNoTracking()
            .Where(r => r.StudentId == student.Id)
            .OrderByDescending(r => r.RegisteredAt)
            .Select(r => new
            {
                r.Id,
                r.SubjectId,
                SubjectCode = r.Subject!.SubjectCode,
                SubjectName = r.Subject.SubjectName,
                r.Subject.Credits,
                r.RegisteredAt
            })
            .ToListAsync();

        return Ok(registrations);
    }

    // POST: api/CourseRegistrations
    // Body: { "subjectId": 1 }
    [HttpPost]
    public async Task<IActionResult> Register(
        [FromBody] RegisterSubjectRequest request)
    {
        var student = await GetCurrentStudentAsync();

        if (student == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy hồ sơ sinh viên."
            });
        }

        if (request.SubjectId <= 0)
        {
            return BadRequest(new
            {
                message = "Mã môn học không hợp lệ."
            });
        }

        var subjectExists = await _context.Subjects
            .AnyAsync(s => s.Id == request.SubjectId);

        if (!subjectExists)
        {
            return NotFound(new
            {
                message = "Môn học không tồn tại."
            });
        }

        var alreadyRegistered = await _context.CourseRegistrations
            .AnyAsync(r =>
                r.StudentId == student.Id &&
                r.SubjectId == request.SubjectId);

        if (alreadyRegistered)
        {
            return Conflict(new
            {
                message = "Bạn đã đăng ký môn học này rồi."
            });
        }

        var registration = new CourseRegistration
        {
            StudentId = student.Id,
            SubjectId = request.SubjectId,
            RegisteredAt = DateTime.UtcNow
        };

        _context.CourseRegistrations.Add(registration);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Ràng buộc unique ở database bảo vệ cả trường hợp
            // hai yêu cầu đăng ký trùng được gửi gần như đồng thời.
            return Conflict(new
            {
                message = "Môn học đã được đăng ký. Vui lòng tải lại danh sách."
            });
        }

        return Ok(new
        {
            message = "Đăng ký môn học thành công.",
            registration.Id,
            registration.SubjectId,
            registration.RegisteredAt
        });
    }

    // DELETE: api/CourseRegistrations/5
    // Hủy đăng ký theo SubjectId, không phải RegistrationId.
    [HttpDelete("{subjectId:int}")]
    public async Task<IActionResult> Cancel(int subjectId)
    {
        var student = await GetCurrentStudentAsync();

        if (student == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy hồ sơ sinh viên."
            });
        }

        var registration = await _context.CourseRegistrations
            .SingleOrDefaultAsync(r =>
                r.StudentId == student.Id &&
                r.SubjectId == subjectId);

        if (registration == null)
        {
            return NotFound(new
            {
                message = "Bạn chưa đăng ký môn học này."
            });
        }

        _context.CourseRegistrations.Remove(registration);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Hủy đăng ký môn học thành công."
        });
    }
}

public class RegisterSubjectRequest
{
    public int SubjectId { get; set; }
}