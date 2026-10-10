
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.Models;

namespace StudentManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ClassesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClassesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Classes
        // Lấy danh sách lớp học
        [HttpGet]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _context.Classes
                .AsNoTracking()
                .OrderBy(c => c.ClassCode)
                .Select(c => new
                {
                    c.Id,
                    c.ClassCode,
                    c.ClassName,
                    c.FacultyId,
                    FacultyName = c.Faculty != null
                        ? c.Faculty.FacultyName
                        : null
                })
                .ToListAsync();

            return Ok(classes);
        }

        // GET: api/Classes/5
        // Lấy thông tin một lớp
        [HttpGet("{id:int}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetClass(int id)
        {
            var item = await _context.Classes
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.ClassCode,
                    c.ClassName,
                    c.FacultyId,
                    FacultyName = c.Faculty != null
                        ? c.Faculty.FacultyName
                        : null
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy lớp học."
                });
            }

            return Ok(item);
        }

        // POST: api/Classes
        // Thêm lớp học
        [HttpPost]
            [Authorize(Roles = "Admin")]
    [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> CreateClass(
            [FromBody] CreateClassRequest request)
        {
            var classCode = request.ClassCode?.Trim();
            var className = request.ClassName?.Trim();

            if (string.IsNullOrWhiteSpace(classCode) ||
                string.IsNullOrWhiteSpace(className))
            {
                return BadRequest(new
                {
                    message = "Mã lớp và tên lớp không được để trống."
                });
            }

            if (classCode.Length > 20)
            {
                return BadRequest(new
                {
                    message = "Mã lớp không được vượt quá 20 ký tự."
                });
            }

            if (className.Length > 100)
            {
                return BadRequest(new
                {
                    message = "Tên lớp không được vượt quá 100 ký tự."
                });
            }

            var codeExists = await _context.Classes
                .AnyAsync(c => c.ClassCode == classCode);

            if (codeExists)
            {
                return Conflict(new
                {
                    message = "Mã lớp đã tồn tại."
                });
            }

            var facultyExists = await _context.Faculties
                .AnyAsync(f => f.Id == request.FacultyId);

            if (!facultyExists)
            {
                return BadRequest(new
                {
                    message = "Khoa được chọn không tồn tại."
                });
            }

            var newClass = new Class
            {
                ClassCode = classCode,
                ClassName = className,
                FacultyId = request.FacultyId
            };

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetClass),
                new { id = newClass.Id },
                new
                {
                    newClass.Id,
                    newClass.ClassCode,
                    newClass.ClassName,
                    newClass.FacultyId
                });
        }

        // PUT: api/Classes/5
        // Cập nhật lớp học
        [HttpPut("{id:int}")]
            [Authorize(Roles = "Admin")]
    [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> UpdateClass(
            int id,
            [FromBody] UpdateClassRequest request)
        {
            var existingClass = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingClass == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy lớp học."
                });
            }

            var classCode = request.ClassCode?.Trim();
            var className = request.ClassName?.Trim();

            if (string.IsNullOrWhiteSpace(classCode) ||
                string.IsNullOrWhiteSpace(className))
            {
                return BadRequest(new
                {
                    message = "Mã lớp và tên lớp không được để trống."
                });
            }

            if (classCode.Length > 20)
            {
                return BadRequest(new
                {
                    message = "Mã lớp không được vượt quá 20 ký tự."
                });
            }

            if (className.Length > 100)
            {
                return BadRequest(new
                {
                    message = "Tên lớp không được vượt quá 100 ký tự."
                });
            }

            var codeExists = await _context.Classes
                .AnyAsync(c =>
                    c.ClassCode == classCode &&
                    c.Id != id);

            if (codeExists)
            {
                return Conflict(new
                {
                    message = "Mã lớp đã được sử dụng bởi lớp khác."
                });
            }

            var facultyExists = await _context.Faculties
                .AnyAsync(f => f.Id == request.FacultyId);

            if (!facultyExists)
            {
                return BadRequest(new
                {
                    message = "Khoa được chọn không tồn tại."
                });
            }

            existingClass.ClassCode = classCode;
            existingClass.ClassName = className;
            existingClass.FacultyId = request.FacultyId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật lớp học thành công.",
                existingClass.Id,
                existingClass.ClassCode,
                existingClass.ClassName,
                existingClass.FacultyId
            });
        }

        // DELETE: api/Classes/5
        // Xóa lớp học
        [HttpDelete("{id:int}")]
            [Authorize(Roles = "Admin")]
    [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var existingClass = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingClass == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy lớp học."
                });
            }

            // Không xóa lớp nếu còn sinh viên thuộc lớp.
            var hasStudents = await _context.Students
                .AnyAsync(s => s.ClassId == id);

            if (hasStudents)
            {
                return Conflict(new
                {
                    message = "Không thể xóa lớp đang có sinh viên."
                });
            }

            _context.Classes.Remove(existingClass);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa lớp học thành công."
            });
        }
    }

    // Dữ liệu nhận khi thêm lớp
    public class CreateClassRequest
    {
        public string ClassCode { get; set; } = string.Empty;

        public string ClassName { get; set; } = string.Empty;

        public int FacultyId { get; set; }
    }

    // Dữ liệu nhận khi cập nhật lớp
    public class UpdateClassRequest
    {
        public string ClassCode { get; set; } = string.Empty;

        public string ClassName { get; set; } = string.Empty;

        public int FacultyId { get; set; }
    }
}

