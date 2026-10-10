
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.DTOs;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GradesController : ControllerBase
{
    private readonly AppDbContext _context;

    public GradesController(AppDbContext context)
    {
        _context = context;
    }

    // =====================================================
    // HÀM LẤY ID GIÁO VIÊN ĐANG ĐĂNG NHẬP
    // =====================================================

    private async Task<Teacher?> GetCurrentTeacherAsync()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        return await _context.Teachers
            .FirstOrDefaultAsync(t => t.UserId == userId);
    }

    // =====================================================
    // GET: api/grades/options
    // LẤY DANH SÁCH SINH VIÊN VÀ MÔN HỌC ĐỂ THÊM ĐIỂM
    // Chỉ giáo viên được sử dụng.
    // =====================================================

    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("options")]
    public async Task<IActionResult> GetGradeOptions()
    {
        var isAdmin = User.IsInRole("Admin");
        var teacher = isAdmin ? null : await GetCurrentTeacherAsync();

        if (!isAdmin && teacher == null)
        {
            return Forbid();
        }

        var students = await _context.Students
            .AsNoTracking()
            .OrderBy(s => s.StudentCode)
            .Select(s => new
            {
                id = s.Id,
                studentCode = s.StudentCode,
                fullName = s.FullName,
                className = s.Class != null
                    ? s.Class.ClassName
                    : "Chưa có lớp"
            })
            .ToListAsync();

        var subjects = await _context.Subjects
            .AsNoTracking()
            .OrderBy(s => s.SubjectCode)
            .Select(s => new
            {
                id = s.Id,
                subjectCode = s.SubjectCode,
                subjectName = s.SubjectName,
                credits = s.Credits
            })
            .ToListAsync();

        return Ok(new
        {
            students,
            subjects
        });
    }

    // =====================================================
    // GET: api/grades?pageNumber=1&pageSize=10
    // HỖ TRỢ TÌM KIẾM, LỌC VÀ PHÂN TRANG
    // =====================================================

    [HttpGet]
    public async Task<IActionResult> GetGrades(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? classId = null,
        [FromQuery] int? subjectId = null,
        [FromQuery] decimal? minScore = null,
        [FromQuery] decimal? maxScore = null)
    {
        if (pageNumber < 1)
        {
            return BadRequest(new
            {
                message = "pageNumber phải lớn hơn hoặc bằng 1."
            });
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(new
            {
                message = "pageSize phải nằm trong khoảng 1 đến 100."
            });
        }

        if (minScore.HasValue &&
            (minScore.Value < 0 || minScore.Value > 10))
        {
            return BadRequest(new
            {
                message = "minScore phải nằm trong khoảng 0 đến 10."
            });
        }

        if (maxScore.HasValue &&
            (maxScore.Value < 0 || maxScore.Value > 10))
        {
            return BadRequest(new
            {
                message = "maxScore phải nằm trong khoảng 0 đến 10."
            });
        }

        if (minScore.HasValue &&
            maxScore.HasValue &&
            minScore.Value > maxScore.Value)
        {
            return BadRequest(new
            {
                message = "minScore không được lớn hơn maxScore."
            });
        }

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        IQueryable<Grade> query = _context.Grades
            .AsNoTracking()
            .Include(g => g.Student)
                .ThenInclude(s => s!.Class)
            .Include(g => g.Subject)
            .Include(g => g.Teacher);

        // Sinh viên chỉ xem điểm thuộc tài khoản của mình.
        if (role == "Student")
        {
            query = query.Where(g =>
                g.Student != null &&
                g.Student.UserId == userId);
        }
        else if (role == "Teacher")
        {
            // Giáo viên chỉ xem các điểm do chính mình phụ trách/nhập.
            var teacher = await _context.Teachers
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.UserId == userId);

            if (teacher == null) return Forbid();
            query = query.Where(g => g.TeacherId == teacher.Id);
        }
        else if (role == "Admin")
        {
            // Admin được xem toàn bộ bảng điểm.
        }
        else
        {
            return Forbid();
        }

        // Tìm theo mã sinh viên, tên sinh viên hoặc email.
        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();

            query = query.Where(g =>
                g.Student != null &&
                (
                    g.Student.StudentCode.Contains(keyword) ||
                    g.Student.FullName.Contains(keyword) ||
                    g.Student.Email.Contains(keyword)
                ));
        }

        if (classId.HasValue)
        {
            query = query.Where(g =>
                g.Student != null &&
                g.Student.ClassId == classId.Value);
        }

        if (subjectId.HasValue)
        {
            query = query.Where(g =>
                g.SubjectId == subjectId.Value);
        }

        if (minScore.HasValue)
        {
            query = query.Where(g =>
                g.Score >= minScore.Value);
        }

        if (maxScore.HasValue)
        {
            query = query.Where(g =>
                g.Score <= maxScore.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(g => g.Student!.StudentCode)
            .ThenBy(g => g.Subject!.SubjectCode)
            .ThenBy(g => g.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GradeResponseDto
            {
                Id = g.Id,
                StudentCode = g.Student!.StudentCode,
                StudentName = g.Student.FullName,
                ClassName = g.Student.Class != null
                    ? g.Student.Class.ClassName
                    : "Chưa có lớp",
                SubjectCode = g.Subject!.SubjectCode,
                SubjectName = g.Subject.SubjectName,
                Score = g.Score,
                TeacherName = g.Teacher!.FullName,
                UpdatedAt = g.UpdatedAt
            })
            .ToListAsync();

        var result = new PagedResultDto<GradeResponseDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        return Ok(result);
    }

    // =====================================================
    // POST: api/grades
    // THÊM ĐIỂM MỚI
    // Chỉ giáo viên được sử dụng.
    // =====================================================

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateGrade(
        [FromBody] CreateGradeDto dto)
    {
        if (dto.Score < 0 || dto.Score > 10)
        {
            return BadRequest(new
            {
                message = "Điểm phải nằm trong khoảng từ 0 đến 10."
            });
        }

        var isAdmin = User.IsInRole("Admin");
        var teacher = isAdmin ? null : await GetCurrentTeacherAsync();

        if (!isAdmin && teacher == null)
        {
            return Forbid();
        }

        // Kiểm tra sinh viên có tồn tại không.
        var studentExists = await _context.Students
            .AnyAsync(s => s.Id == dto.StudentId);

        if (!studentExists)
        {
            return BadRequest(new
            {
                message = "Sinh viên được chọn không tồn tại."
            });
        }

        // Kiểm tra môn học có tồn tại không.
        var subjectExists = await _context.Subjects
            .AnyAsync(s => s.Id == dto.SubjectId);

        if (!subjectExists)
        {
            return BadRequest(new
            {
                message = "Môn học được chọn không tồn tại."
            });
        }

        // Mô hình hiện tại chưa có học kỳ hoặc loại đầu điểm,
        // nên ngăn tạo hai bản ghi cho cùng sinh viên và môn học.
        var duplicateExists = await _context.Grades
            .AnyAsync(g =>
                g.StudentId == dto.StudentId &&
                g.SubjectId == dto.SubjectId);

        if (duplicateExists)
        {
            return Conflict(new
            {
                message =
                    "Sinh viên này đã có điểm cho môn học đã chọn."
            });
        }

        // Không nhận TeacherId từ phía trình duyệt.
        // Bản ghi luôn thuộc giáo viên đang đăng nhập.
        var teacherId = teacher?.Id ?? await _context.Teachers.Select(t => (int?)t.Id).FirstOrDefaultAsync();
        if (!teacherId.HasValue)
        {
            return BadRequest(new { message = "Cần tạo ít nhất một hồ sơ giáo viên trước khi nhập điểm." });
        }

        var grade = new Grade
        {
            StudentId = dto.StudentId,
            SubjectId = dto.SubjectId,
            TeacherId = teacherId.Value,
            Score = dto.Score,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Grades.Add(grade);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Thêm điểm thành công.",
            gradeId = grade.Id,
            studentId = grade.StudentId,
            subjectId = grade.SubjectId,
            score = grade.Score,
            teacherId = grade.TeacherId,
            updatedAt = grade.UpdatedAt
        });
    }

    // =====================================================
    // PUT: api/grades/1
    // SỬA ĐIỂM
    // Chỉ giáo viên phụ trách bản ghi mới được sửa.
    // =====================================================

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGrade(
        int id,
        [FromBody] UpdateGradeDto dto)
    {
        if (dto.Score < 0 || dto.Score > 10)
        {
            return BadRequest(new
            {
                message = "Điểm phải nằm trong khoảng từ 0 đến 10."
            });
        }

        var grade = await _context.Grades
            .FirstOrDefaultAsync(g => g.Id == id);

        if (grade == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy bản ghi điểm."
            });
        }

        var isAdmin = User.IsInRole("Admin");
        var teacher = isAdmin ? null : await GetCurrentTeacherAsync();

        if (!isAdmin && teacher == null)
        {
            return Forbid();
        }

        // Giáo viên chỉ sửa điểm do mình phụ trách; Admin có quyền quản trị.
        if (!isAdmin && grade.TeacherId != teacher!.Id)
        {
            return Forbid();
        }

        grade.Score = dto.Score;
        grade.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật điểm thành công.",
            gradeId = grade.Id,
            score = grade.Score,
            updatedAt = grade.UpdatedAt
        });
    }

    // =====================================================
    // DELETE: api/grades/1
    // XÓA ĐIỂM
    // Chỉ giáo viên phụ trách bản ghi mới được xóa.
    // =====================================================

    [Authorize(Roles = "Teacher,Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGrade(int id)
    {
        var grade = await _context.Grades
            .FirstOrDefaultAsync(g => g.Id == id);

        if (grade == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy bản ghi điểm."
            });
        }

        var isAdmin = User.IsInRole("Admin");
        var teacher = isAdmin ? null : await GetCurrentTeacherAsync();

        if (!isAdmin && teacher == null)
        {
            return Forbid();
        }

        // Giáo viên chỉ xóa điểm do mình phụ trách; Admin có quyền quản trị.
        if (!isAdmin && grade.TeacherId != teacher!.Id)
        {
            return Forbid();
        }

        _context.Grades.Remove(grade);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Xóa điểm thành công.",
            gradeId = id
        });
    }
}