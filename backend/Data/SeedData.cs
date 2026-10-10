using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Models;
using StudentManagement.Api.Services;

namespace StudentManagement.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;
        var context = provider.GetRequiredService<AppDbContext>();
        var passwordService = provider.GetRequiredService<PasswordService>();
        var configuration = provider.GetRequiredService<IConfiguration>();

        // Tạo tài khoản quản trị riêng; không bỏ qua chỉ vì database đã có user.
        var adminUsername = configuration["AdminSeed:Username"]?.Trim();
        if (string.IsNullOrWhiteSpace(adminUsername)) adminUsername = "admin";
        var adminPassword = configuration["AdminSeed:Password"];
        if (string.IsNullOrWhiteSpace(adminPassword)) adminPassword = "Admin@123456";

        var admin = await context.Users.SingleOrDefaultAsync(u => u.Username == adminUsername);
        if (admin == null)
        {
            admin = new User { Username = adminUsername, Role = "Admin" };
            admin.PasswordHash = passwordService.HashPassword(admin, adminPassword);
            context.Users.Add(admin);
            await context.SaveChangesAsync();
        }
        else if (!string.Equals(admin.Role, "Admin", StringComparison.Ordinal))
        {
            // Không tự ý nâng quyền một tài khoản đang tồn tại.
            Console.Error.WriteLine($"Seed cảnh báo: tài khoản '{adminUsername}' đã tồn tại nhưng không có vai trò Admin. Hãy kiểm tra thủ công.");
        }

        // Chỉ tạo dữ liệu minh họa khi chưa có dữ liệu người dùng.
        if (await context.Users.AnyAsync(u => u.Role == "Student" || u.Role == "Teacher"))
            return;

        var classEntity = new Class
        {
            ClassCode = "CNTT01",
            ClassName = "Công nghệ thông tin 01"
        };
        var subject = new Subject
        {
            SubjectCode = "CSDL01",
            SubjectName = "Cơ sở dữ liệu",
            Credits = 3
        };
        var studentUser = new User { Username = "student01", Role = "Student" };
        studentUser.PasswordHash = passwordService.HashPassword(studentUser, "Student@123");
        var teacherUser = new User { Username = "teacher01", Role = "Teacher" };
        teacherUser.PasswordHash = passwordService.HashPassword(teacherUser, "Teacher@123");
        var student = new Student
        {
            StudentCode = "SV0001", FullName = "Nguyễn Văn An",
            Email = "sv0001@example.com", Class = classEntity, User = studentUser
        };
        var teacher = new Teacher
        {
            TeacherCode = "GV0001", FullName = "Trần Văn Bình",
            Email = "gv0001@example.com", User = teacherUser
        };

        context.Classes.Add(classEntity);
        context.Subjects.Add(subject);
        context.Students.Add(student);
        context.Teachers.Add(teacher);
        await context.SaveChangesAsync();

        context.Grades.Add(new Grade
        {
            StudentId = student.Id, SubjectId = subject.Id, TeacherId = teacher.Id,
            Score = 8.5m, UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}
