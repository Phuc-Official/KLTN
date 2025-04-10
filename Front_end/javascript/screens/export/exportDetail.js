async function loadCustomers() {
  try {
    const response = await fetch("http://localhost:3000/api/khachhang");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách khách hàng");
    }
    const customers = await response.json();
    return customers; // Trả về danh sách khách hàng
  } catch (error) {
    console.error("Lỗi khi tải khách hàng:", error);
    return [];
  }
}

async function loadProducts() {
  try {
    const response = await fetch("http://localhost:3000/api/sanpham");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách sản phẩm");
    }
    const products = await response.json();
    return products; // Trả về danh sách sản phẩm
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
    return [];
  }
}

async function loadEmployees() {
  try {
    const response = await fetch("http://localhost:3000/api/nhanvien");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách nhân viên");
    }
    const employees = await response.json();
    return employees;
  } catch (error) {
    console.error("Lỗi khi tải nhân viên:", error);
    return [];
  }
}

async function loadUnitOfMeasurement() {
  try {
    const response = await fetch("http://localhost:3000/api/donvitinh");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách đơn vị tính");
    }
    const units = await response.json();
    return units; // Trả về danh sách đơn vị tính
  } catch (error) {
    console.error("Lỗi khi tải đơn vị tính:", error);
    return [];
  }
}

async function fetchExportDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuXuat = urlParams.get("id");

  console.log("Mã phiếu xuất:", maPhieuXuat);

  try {
    const response = await fetch(
      `http://localhost:3000/api/phieuxuat/${maPhieuXuat}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết phiếu xuất.");
    }

    const textResponse = await response.text(); // Lấy phản hồi dưới dạng chuỗi
    const exports = JSON.parse(textResponse); // Phân tích cú pháp nếu cần

    const detailsContainer = document.getElementById("export-details");

    if (!detailsContainer) {
      throw new Error("Phần tử export-details không tồn tại.");
    }

    // Tải danh sách sản phẩm, đơn vị tính, khách hàng, và nhân viên
    const [products, units, customers, employees] = await Promise.all([
      loadProducts(),
      loadUnitOfMeasurement(),
      loadCustomers(),
      loadEmployees(),
    ]);

    document.getElementById("export-id").textContent = exports.MaPhieuXuat;

    // Tìm tên khách hàng trong danh sách
    const customer = customers.find(
      (c) => c.MaKhachHang === exports.MaKhachHang // Thay đổi từ MaNhaCungCap thành MaKhachHang
    );
    const customerName = customer ? customer.TenKhachHang : "Không tìm thấy";
    document.getElementById("customer").value = customerName; // Thay đổi từ supplier thành customer

    // Tìm tên nhân viên trong danh sách
    const employee = employees.find((e) => e.MaNhanVien === exports.MaNhanVien);
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    // Hiển thị danh sách sản phẩm
    let productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    exports.SanPhamList.forEach((product) => {
      const foundProduct = products.find(
        (p) => p.MaSanPham === product.MaSanPham
      );
      const unit = units.find((u) => u.MaDonVi === product.MaDonVi);

      const productName = foundProduct
        ? foundProduct.TenSanPham
        : "Không tìm thấy";
      const unitName = unit ? unit.TenDonVi : "Không tìm thấy";

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${product.MaSanPham}</td>
                <td>${productName}</td>
                 <td>${unitName}</td>
                <td>${product.SoLuong}</td>              

            `;
      productList.appendChild(row);
    });

    // Cập nhật thông tin khác vào side-panel
    document.getElementById("date").value = new Date(
      exports.NgayXuat // Thay đổi từ NgayNhap thành NgayXuat
    ).toLocaleDateString();
    // document.getElementById("total-price").value = exports.TongGiaTri;
    document.getElementById("description").value = exports.MoTa;
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phiếu xuất:", error);
    const detailsContainer = document.getElementById("export-details");
    if (detailsContainer) {
      detailsContainer.innerHTML = "<p>Không thể tải chi tiết phiếu xuất.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchExportDetails);

function cancel() {
  // Quay về trang trước
  window.history.back();
}
