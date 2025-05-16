// Gợi ý mã nhân viên tiếp theo
async function suggestNextEmployeeId() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien/max-manhanvien`);
    const data = await response.json();
    const nextEmployeeId = data.maxMaNhanVien
      ? generateNextEmployeeId(data.maxMaNhanVien)
      : "NV001";

    const input = document.getElementById("MaNhanVien");
    if (input) {
      input.value = nextEmployeeId;
    }
  } catch (error) {
    console.error("Lỗi khi gợi ý mã nhân viên:", error);
  }
}

function generateNextEmployeeId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(3, "0");
  return prefix + nextNumber;
}

// Hiển thị thông tin người dùng
function displayUserInfo() {
  const userData = localStorage.getItem("currentUser");
  const infoDiv = document.getElementById("user-info");

  if (!infoDiv) return; // Không có phần tử thì bỏ qua

  if (!userData) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userData);
  const role = user.IsAdmin ? "Quản lý" : "Nhân viên";

  infoDiv.innerHTML = `
    <p><strong>Mã nhân viên:</strong> ${user.MaNhanVien}</p>
    <p><strong>Tên đăng nhập:</strong> ${user.TenDangNhap}</p>
    <p><strong>Tên nhân viên:</strong> ${user.TenNhanVien}</p>
    <p><strong>Quyền:</strong> ${role}</p>
  `;
}

// Đăng xuất người dùng
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// Xử lý đăng nhập
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-message");

  errorMessage.textContent = "";

  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      window.location.href = "productList.html";
    } else {
      errorMessage.textContent = result.message || "Đăng nhập thất bại.";
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    errorMessage.textContent = "Có lỗi xảy ra khi đăng nhập.";
  }
}

// Tạo nhân viên mới
async function createUser() {
  const MaNhanVien = document.getElementById("MaNhanVien").value.trim();
  const TenDangNhap = document.getElementById("TenDangNhap").value.trim();
  const MatKhau = document.getElementById("MatKhau").value.trim();
  const TenNhanVien = document.getElementById("TenNhanVien").value.trim();
  const IsAdmin = document.getElementById("IsAdmin").value === "true";

  if (!MaNhanVien || !TenDangNhap || !MatKhau || !TenNhanVien) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        MaNhanVien,
        TenDangNhap,
        MatKhau,
        TenNhanVien,
        IsAdmin,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi tạo nhân viên");
    }

    alert("Tạo nhân viên thành công!");
    document.getElementById("MaNhanVien").value = "";
    document.getElementById("TenDangNhap").value = "";
    document.getElementById("MatKhau").value = "";
    document.getElementById("TenNhanVien").value = "";
    document.getElementById("IsAdmin").value = "false";

    window.location.href = "employee.html";
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

// Hủy (quay lại trang trước)
function cancel() {
  window.history.back();
}

// Tự động gọi các hàm phù hợp sau khi DOM đã sẵn sàng
window.addEventListener("DOMContentLoaded", () => {
  displayUserInfo(); // Nếu có phần tử user-info
  suggestNextEmployeeId(); // Nếu có input mã nhân viên

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});
