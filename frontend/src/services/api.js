// Địa chỉ API của backend ASP.NET Core
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5170"}/api`;

// Hàm gửi yêu cầu đến backend
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,

    // Gửi và nhận cookie đăng nhập
    credentials: "include",

    // Thiết lập các header mặc định
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Đọc nội dung phản hồi
  const text = await response.text();

  // Chuyển nội dung JSON thành đối tượng JavaScript
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Xử lý lỗi từ backend
  if (!response.ok) {
    let message = "Đã xảy ra lỗi khi gửi yêu cầu.";

    if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.title) {
      message = data.title;
    } else if (data?.errors) {
      message = Object.values(data.errors).flat().join(" ");
    } else {
      message = `${message} Mã lỗi: ${response.status}`;
    }

    throw new Error(message);
  }

  return data;
}

// Các chức năng giao tiếp với backend
export const api = {
  // Đăng nhập
  login(username, password) {
    return request("/Auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });
  },

  // Lấy thông tin tài khoản đang đăng nhập
  getMe() {
    return request("/Auth/me");
  },

  // Đăng xuất
  logout() {
    return request("/Auth/logout", {
      method: "POST",
    });
  },


  // ==============================
  // QUẢN LÝ GIÁO VIÊN (ADMIN)
  // ==============================
  getTeachers(search = "") {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    return request(`/Teachers${query ? `?${query}` : ""}`);
  },

  createTeacher(data) {
    return request("/Teachers", { method: "POST", body: JSON.stringify(data) });
  },

  updateTeacher(id, data) {
    return request(`/Teachers/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  deleteTeacher(id) {
    return request(`/Teachers/${id}`, { method: "DELETE" });
  },

  // Lấy danh sách điểm
  getGrades({
    pageNumber = 1,
    pageSize = 10,
    search = "",
    classId,
    subjectId,
    minScore,
    maxScore,
  } = {}) {
    const params = new URLSearchParams();

    params.set("pageNumber", String(pageNumber));
    params.set("pageSize", String(pageSize));

    if (search.trim()) params.set("search", search.trim());
    if (classId != null) params.set("classId", String(classId));
    if (subjectId != null) params.set("subjectId", String(subjectId));
    if (minScore != null && minScore !== "") {
      params.set("minScore", String(minScore));
    }
    if (maxScore != null && maxScore !== "") {
      params.set("maxScore", String(maxScore));
    }

    return request(`/Grades?${params.toString()}`);
  },

  // Lấy danh sách sinh viên và môn học để thêm điểm
  getGradeOptions() {
    return request("/Grades/options");
  },

  // Thêm điểm
  createGrade(data) {
    return request("/Grades", {
      method: "POST",
      body: JSON.stringify({
        studentId: Number(data.studentId),
        subjectId: Number(data.subjectId),
        score: Number(data.score),
      }),
    });
  },

  // Sửa điểm
  updateGrade(id, score) {
    return request(`/Grades/${id}`, {
      method: "PUT",
      body: JSON.stringify({ score: Number(score) }),
    });
  },

  // Xóa điểm
  deleteGrade(id) {
    return request(`/Grades/${id}`, {
      method: "DELETE",
    });
  },


  // Lấy danh sách sinh viên có tìm kiếm và phân trang
  getStudents({
    page = 1,
    pageSize = 10,
    search = "",
    classId,
    sortBy = "studentCode",
    sortOrder = "asc",
  } = {}) {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (classId != null && classId !== "") {
      params.set("classId", String(classId));
    }

    return request(`/Students?${params.toString()}`);
  },

  // Lấy thông tin chi tiết một sinh viên
  getStudent(id) {
    return request(`/Students/${id}`);
  },

  // Thêm sinh viên mới
  createStudent(student) {
    return request("/Students", {
      method: "POST",
      body: JSON.stringify(student),
    });
  },

  // Cập nhật thông tin sinh viên
  updateStudent(id, student) {
    return request(`/Students/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    });
  },

  // Xóa sinh viên
  deleteStudent(id) {
    return request(`/Students/${id}`, {
      method: "DELETE",
    });
  },

  // Lấy thống kê sinh viên
  getStudentStatistics() {
    return request("/Students/statistics");
  },

  // Lấy danh sách lớp học

// ==============================
// QUẢN LÝ KHOA
// ==============================

getFaculties(search = "") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  return request(`/Faculties${query ? `?${query}` : ""}`);
},

getFaculty(id) {
  return request(`/Faculties/${id}`);
},

createFaculty(data) {
  return request("/Faculties", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

updateFaculty(id, data) {
  return request(`/Faculties/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
},

deleteFaculty(id) {
  return request(`/Faculties/${id}`, {
    method: "DELETE",
  });
},

// ==============================
// QUẢN LÝ LỚP HỌC
// ==============================

getClasses(search = "", facultyId = null) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (facultyId !== null && facultyId !== "") {
    params.set("facultyId", String(facultyId));
  }

  const query = params.toString();

  return request(`/Classes${query ? `?${query}` : ""}`);
},

getClass(id) {
  return request(`/Classes/${id}`);
},

createClass(data) {
  return request("/Classes", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

updateClass(id, data) {
  return request(`/Classes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
},

deleteClass(id) {
  return request(`/Classes/${id}`, {
    method: "DELETE",
  });
},


getSubjects(search = "") {
const params = new URLSearchParams();

if (search.trim()) {
params.set("search", search.trim());
}

const query = params.toString();

return request(`/Subjects${query ? `?${query}` : ""}`);
},

getSubject(id) {
return request(`/Subjects/${id}`);
},

createSubject(data) {
return request("/Subjects", {
method: "POST",
body: JSON.stringify(data),
});
},

updateSubject(id, data) {
return request(`/Subjects/${id}`, {
method: "PUT",
body: JSON.stringify(data),
});
},

deleteSubject(id) {
return request(`/Subjects/${id}`, {
method: "DELETE",
});
},
// Đăng ký môn học: lấy các môn chưa đăng ký.
getAvailableSubjects() {
  return request("/CourseRegistrations/available");
},

// Xem các môn đã đăng ký của sinh viên đang đăng nhập.
getMyCourseRegistrations() {
  return request("/CourseRegistrations/mine");
},

// Đăng ký một môn.
registerSubject(subjectId) {
  return request("/CourseRegistrations", {
    method: "POST",
    body: JSON.stringify({ subjectId }),
  });
},

// Hủy đăng ký theo mã môn học.
cancelSubjectRegistration(subjectId) {
  return request(`/CourseRegistrations/${subjectId}`, {
    method: "DELETE",
  });
},
};


