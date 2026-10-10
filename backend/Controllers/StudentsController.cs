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
[Authorize(Roles = "Teacher,Admin")]
public class StudentsController : ControllerBase
{
private readonly AppDbContext _context;
private readonly PasswordService _passwordService;


public StudentsController(
    AppDbContext context,
    PasswordService passwordService)
{
    _context = context;
    _passwordService = passwordService;
}

// GET: api/Students
// Phân trang, tìm kiếm, lọc theo lớp và sắp xếp.
[HttpGet]
public async Task<IActionResult> GetStudents(
[FromQuery] string? search,
[FromQuery] int? classId,
[FromQuery] int page = 1,
[FromQuery] int pageSize = 10,
[FromQuery] string sortBy = "studentCode",
[FromQuery] string sortOrder = "asc")
{
// Kiểm tra tham số phân trang.
if (page < 1)
{
return BadRequest(new
{
message = "page phải lớn hơn hoặc bằng 1."
});
}

if (pageSize < 1 || pageSize > 100)
{
    return BadRequest(new
    {
        message = "pageSize phải từ 1 đến 100."
    });
}

// Chỉ cho phép sắp xếp theo các trường hợp lệ.
var allowedSortFields = new[]
{
    "studentCode",
    "fullName",
    "email"
};

if (!allowedSortFields.Contains(
    sortBy,
    StringComparer.OrdinalIgnoreCase))
{
    return BadRequest(new
    {
        message = "sortBy chỉ được là studentCode, fullName hoặc email."
    });
}

if (sortOrder.ToLower() != "asc" &&
    sortOrder.ToLower() != "desc")
{
    return BadRequest(new
    {
        message = "sortOrder chỉ được là asc hoặc desc."
    });
}

var query = _context.Students
    .AsNoTracking()
    .Include(s => s.Class)
    .AsQueryable();

// Tìm kiếm theo mã, họ tên hoặc email.
if (!string.IsNullOrWhiteSpace(search))
{
    var keyword = search.Trim();

    query = query.Where(s =>
        s.StudentCode.Contains(keyword) ||
        s.FullName.Contains(keyword) ||
        s.Email.Contains(keyword));
}

// Lọc theo lớp.
if (classId.HasValue)
{
    query = query.Where(s => s.ClassId == classId.Value);
}

// Đếm tổng số sinh viên sau khi lọc.
var totalItems = await query.CountAsync();

// Sắp xếp dữ liệu.
var descending = sortOrder.Equals(
    "desc",
    StringComparison.OrdinalIgnoreCase);

query = sortBy.ToLower() switch
{
    "studentcode" => descending
        ? query.OrderByDescending(s => s.StudentCode)
        : query.OrderBy(s => s.StudentCode),

    "fullname" => descending
        ? query.OrderByDescending(s => s.FullName)
        : query.OrderBy(s => s.FullName),

    "email" => descending
        ? query.OrderByDescending(s => s.Email)
        : query.OrderBy(s => s.Email),

    _ => query.OrderBy(s => s.StudentCode)
};

// Lấy dữ liệu của trang hiện tại.
var students = await query
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(s => new
    {
        s.Id,
        s.StudentCode,
        s.FullName,
        s.Email,
        s.ClassId,
        ClassName = s.Class != null
            ? s.Class.ClassName
            : null
    })
    .ToListAsync();

var totalPages = (int)Math.Ceiling(
    totalItems / (double)pageSize);

return Ok(new
{
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage = page > 1,
    hasNextPage = page < totalPages,
    data = students
});


}


// GET: api/Students/1
// Lấy thông tin một sinh viên theo ID.
[HttpGet("{id:int}")]
public async Task<IActionResult> GetStudent(int id)
{
    var student = await _context.Students
        .AsNoTracking()
        .Where(s => s.Id == id)
        .Select(s => new
        {
            s.Id,
            s.StudentCode,
            s.FullName,
            s.Email,
            s.ClassId,
            ClassName = s.Class != null
                ? s.Class.ClassName
                : null
        })
        .FirstOrDefaultAsync();

    if (student == null)
    {
        return NotFound(new
        {
            message = "Không tìm thấy sinh viên."
        });
    }

    return Ok(student);
}

// POST: api/Students
// Tạo tài khoản và hồ sơ sinh viên.
[HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateStudent(
    [FromBody] CreateStudentDto dto)
{
    var studentCode = dto.StudentCode.Trim();
    var fullName = dto.FullName.Trim();
    var email = dto.Email.Trim();
    var username = dto.Username.Trim();

    // Kiểm tra mã sinh viên đã tồn tại.
    if (await _context.Students.AnyAsync(
        s => s.StudentCode == studentCode))
    {
        return Conflict(new
        {
            message = "Mã sinh viên đã tồn tại."
        });
    }

    // Kiểm tra email đã tồn tại.
    if (await _context.Students.AnyAsync(
        s => s.Email == email))
    {
        return Conflict(new
        {
            message = "Email sinh viên đã tồn tại."
        });
    }

    // Kiểm tra tên đăng nhập đã tồn tại.
    if (await _context.Users.AnyAsync(
        u => u.Username == username))
    {
        return Conflict(new
        {
            message = "Tên đăng nhập đã tồn tại."
        });
    }

    // Nếu có chọn lớp thì phải kiểm tra lớp tồn tại.
    if (dto.ClassId.HasValue)
    {
        var classExists = await _context.Classes.AnyAsync(
            c => c.Id == dto.ClassId.Value);

        if (!classExists)
        {
            return BadRequest(new
            {
                message = "Lớp học không tồn tại."
            });
        }
    }

    // Tạo tài khoản sinh viên.
    var user = new User
    {
        Username = username,
        Role = "Student"
    };

    // Mã hóa mật khẩu trước khi lưu.
    user.PasswordHash = _passwordService.HashPassword(
        user,
        dto.Password);

    // Tạo hồ sơ sinh viên và liên kết tài khoản.
    var student = new Student
    {
        StudentCode = studentCode,
        FullName = fullName,
        Email = email,
        ClassId = dto.ClassId,
        User = user
    };

    // Lưu tài khoản và hồ sơ trong cùng transaction.
    await using var transaction =
        await _context.Database.BeginTransactionAsync();

    try
    {
        _context.Users.Add(user);
        _context.Students.Add(student);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }
    catch (DbUpdateException)
    {
        await transaction.RollbackAsync();

        return Conflict(new
        {
            message = "Không thể tạo sinh viên. Hãy kiểm tra mã sinh viên, email và tên đăng nhập có bị trùng không."
        });
    }

    return CreatedAtAction(
        nameof(GetStudent),
        new { id = student.Id },
        new
        {
            message = "Tạo sinh viên thành công.",
            student = new
            {
                student.Id,
                student.StudentCode,
                student.FullName,
                student.Email,
                student.ClassId,
                Username = user.Username
            }
        });
}


// PUT: api/Students/1
// Cập nhật họ tên, email và lớp của sinh viên.
[HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStudent(
int id,
[FromBody] UpdateStudentDto dto)
{
var student = await _context.Students
.FirstOrDefaultAsync(s => s.Id == id);


if (student == null)
{
    return NotFound(new
    {
        message = "Không tìm thấy sinh viên."
    });
}

var fullName = dto.FullName.Trim();
var email = dto.Email.Trim();

// Kiểm tra email đã được sinh viên khác sử dụng chưa.
var emailExists = await _context.Students.AnyAsync(
    s => s.Email == email && s.Id != id);

if (emailExists)
{
    return Conflict(new
    {
        message = "Email đã được sử dụng bởi sinh viên khác."
    });
}

// Kiểm tra lớp học nếu người dùng có chọn lớp.
if (dto.ClassId.HasValue)
{
    var classExists = await _context.Classes.AnyAsync(
        c => c.Id == dto.ClassId.Value);

    if (!classExists)
    {
        return BadRequest(new
        {
            message = "Lớp học không tồn tại."
        });
    }
}

student.FullName = fullName;
student.Email = email;
student.ClassId = dto.ClassId;

try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateException)
{
    return Conflict(new
    {
        message = "Không thể cập nhật. Email có thể đã được sử dụng."
    });
}

return Ok(new
{
    message = "Cập nhật sinh viên thành công.",
    student = new
    {
        student.Id,
        student.StudentCode,
        student.FullName,
        student.Email,
        student.ClassId
    }
});


}


// DELETE: api/Students/1
[HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStudent(int id)
{
var student = await _context.Students
.Include(s => s.Grades)
.FirstOrDefaultAsync(s => s.Id == id);


if (student == null)
{
    return NotFound(new
    {
        message = "Không tìm thấy sinh viên."
    });
}

if (student.Grades.Any())
{
    return Conflict(new
    {
        message = "Không thể xóa sinh viên vì đã có bảng điểm."
    });
}

var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Id == student.UserId);

if (user != null)
{
    var teacherExists = await _context.Teachers
        .AnyAsync(t => t.UserId == user.Id);

    if (teacherExists)
    {
        return Conflict(new
        {
            message = "Tài khoản đang được giáo viên sử dụng, không thể xóa."
        });
    }
}

await using var transaction =
    await _context.Database.BeginTransactionAsync();

try
{
    _context.Students.Remove(student);
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

    return Conflict(new
    {
        message = "Không thể xóa sinh viên do dữ liệu đang có liên kết với bản ghi khác."
    });
}

return Ok(new
{
    message = "Xóa sinh viên thành công.",
    studentId = id
});

}



// GET: api/Students/statistics
// Thống kê tổng số sinh viên và số lượng theo lớp.
[HttpGet("statistics")]
public async Task<IActionResult> GetStudentStatistics()
{
// Đếm tổng số sinh viên.
var totalStudents = await _context.Students.CountAsync();


// Đếm số sinh viên đã được xếp lớp.
var assignedStudents = await _context.Students
    .CountAsync(s => s.ClassId != null);

// Đếm số sinh viên chưa được xếp lớp.
var unassignedStudents = totalStudents - assignedStudents;

// Thống kê số sinh viên theo từng lớp.
var studentsByClass = await _context.Classes
    .AsNoTracking()
    .Select(c => new
    {
        c.Id,
        c.ClassCode,
        c.ClassName,
        StudentCount = c.Students.Count()
    })
    .OrderBy(c => c.ClassName)
    .ToListAsync();

return Ok(new
{
    totalStudents,
    assignedStudents,
    unassignedStudents,
    studentsByClass
});


}


}
