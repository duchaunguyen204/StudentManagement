
namespace StudentManagement.Api.DTOs;

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();

    public int PageNumber { get; set; }

    public int PageSize { get; set; }

    public int TotalCount { get; set; }

    public int TotalPages =>
        PageSize > 0
            ? (int)Math.Ceiling(TotalCount / (double)PageSize)
            : 0;
}