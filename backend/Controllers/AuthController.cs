
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Api.Data;
using StudentManagement.Api.DTOs;
using StudentManagement.Api.Services;

namespace StudentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public AuthController(
        AppDbContext context,
        PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var username = dto.Username.Trim();

        var user = await _context.Users
            .Include(u => u.Student)
            .Include(u => u.Teacher)
            .SingleOrDefaultAsync(u => u.Username == username);

        if (user == null ||
            !_passwordService.VerifyPassword(user, dto.Password))
        {
            return Unauthorized(new
            {
                message = "Tên đăng nhập hoặc mật khẩu không đúng."
            });
        }

        if (user.Role == "Student" && user.Student == null)
        {
            return Unauthorized(new
            {
                message = "Tài khoản sinh viên chưa được liên kết hồ sơ."
            });
        }

        if (user.Role == "Teacher" && user.Teacher == null)
        {
            return Unauthorized(new
            {
                message = "Tài khoản giáo viên chưa được liên kết hồ sơ."
            });
        }

        if (user.Role == "Admin" && (user.Student != null || user.Teacher != null))
        {
            return Unauthorized(new
            {
                message = "Tài khoản quản trị không được liên kết hồ sơ sinh viên hoặc giáo viên."
            });
        }

        if (user.Role != "Student" && user.Role != "Teacher" && user.Role != "Admin")
        {
            return Unauthorized(new
            {
                message = "Vai trò tài khoản không hợp lệ."
            });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role)
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme);

        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal);

        return Ok(new
        {
            message = "Đăng nhập thành công.",
            username = user.Username,
            role = user.Role
        });
    }

    // GET: api/auth/me
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            username = User.Identity?.Name,
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    // POST: api/auth/logout
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new
        {
            message = "Đăng xuất thành công."
        });
    }
}