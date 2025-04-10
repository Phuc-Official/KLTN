async function loadSuppliers() {
  try {
    const response = await fetch("http://localhost:3000/api/nhacungcap");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách nhà cung cấp");
    }
    const suppliers = await response.json();
    return suppliers; // Trả về danh sách nhà cung cấp
  } catch (error) {
    console.error("Lỗi khi tải nhà cung cấp:", error);
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

let order;
let units = [];
let selectedSupplierId;
let selectedEmployeeId;

async function fetchOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maDonHang = urlParams.get("id");

  try {
    const response = await fetch(
      `http://localhost:3000/api/donhang/${maDonHang}`
    );

    if (!response.ok) {
      throw new Error("Không thể tải chi tiết đơn hàng.");
    }

    order = await response.json(); // Lưu chi tiết đơn hàng vào biến toàn cục

    // Tải danh sách sản phẩm, đơn vị tính, nhà cung cấp, và nhân viên
    const [products, units, suppliers, employees] = await Promise.all([
      loadProducts(),
      loadUnitOfMeasurement(),
      loadSuppliers(),
      loadEmployees(),
    ]);

    document.getElementById("order-id").textContent = order.MaDonHang;

    // Tìm mã và tên nhà cung cấp
    const supplier = suppliers.find(
      (s) => s.MaNhaCungCap === order.MaNhaCungCap
    );
    selectedSupplierId = supplier ? supplier.MaNhaCungCap : null;
    document.getElementById("supplier").value = supplier
      ? supplier.TenNhaCungCap
      : "Không tìm thấy";

    // Tìm mã và tên nhân viên
    const employee = employees.find((e) => e.MaNhanVien === order.MaNhanVien);
    selectedEmployeeId = employee ? employee.MaNhanVien : null;
    document.getElementById("employee").value = employee
      ? employee.TenNhanVien
      : "Không tìm thấy";

    // Hiển thị danh sách sản phẩm
    let productList = document.getElementById("product-list");
    order.SanPhamList.forEach((product) => {
      const foundProduct = products.find(
        (p) => p.MaSanPham === product.MaSanPham
      );

      const productName = foundProduct
        ? foundProduct.TenSanPham
        : "Không tìm thấy";
      const unit = units.find((u) => u.MaDonVi === product.MaDonVi);
      const unitName = unit ? unit.TenDonVi : "Không tìm thấy";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.MaSanPham}</td>
        <td>${productName}</td>
        <td>${unitName}</td>
        <td>${product.SoLuong}</td>          
        <td>${product.GiaSanPham}</td>
      `;
      productList.appendChild(row);
    });

    // Cập nhật thông tin khác
    document.getElementById("date").value = new Date(
      order.NgayNhap
    ).toLocaleDateString();
    document.getElementById("total-price").value = order.TongGiaTri;
    document.getElementById("description").value = order.MoTa;
  } catch (error) {
    console.error("Lỗi khi tải chi tiết đơn hàng:", error);
    const detailsContainer = document.getElementById("order-details");
    if (detailsContainer) {
      detailsContainer.innerHTML = "<p>Không thể tải chi tiết đơn hàng.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchOrderDetails);

function cancel() {
  // Quay về trang trước
  window.history.back();
}

document
  .getElementById("add-receipt-button")
  .addEventListener("click", function () {
    const orderId = document.getElementById("order-id").textContent.trim();
    const date = document.getElementById("date").value.trim();
    const totalPrice = document.getElementById("total-price").value.trim();
    const description = document.getElementById("description").value.trim();

    // Lấy danh sách sản phẩm đã chọn
    const selectedProducts = Array.from(
      document.querySelectorAll("#product-list tr")
    ).map((row) => {
      const maSanPham = row.cells[0].textContent.trim();
      const tenSanPham = row.cells[1].textContent.trim();
      const soLuong = row.cells[3].textContent.trim();
      const gia = row.cells[4].textContent.trim();
      const maDonVi = order.SanPhamList.find(
        (p) => p.MaSanPham === maSanPham
      ).MaDonVi; // Lấy MaDonVi từ chi tiết đơn hàng

      return {
        MaSanPham: maSanPham,
        TenSanPham: tenSanPham,
        SoLuong: soLuong,
        Gia: gia,
        MaDonVi: maDonVi, // Lưu mã đơn vị
      };
    });

    // Chuyển đổi danh sách sản phẩm thành chuỗi JSON
    const selectedProductsJson = encodeURIComponent(
      JSON.stringify(selectedProducts)
    );

    const createReceiptUrl = `confirmReceipt.html?orderId=${encodeURIComponent(
      orderId
    )}&supplier=${encodeURIComponent(
      selectedSupplierId
    )}&employee=${encodeURIComponent(
      selectedEmployeeId
    )}&date=${encodeURIComponent(date)}&totalPrice=${encodeURIComponent(
      totalPrice
    )}&description=${encodeURIComponent(
      description
    )}&products=${selectedProductsJson}`;

    window.location.href = createReceiptUrl; // Chuyển hướng đến trang xác nhận
  });

function formatDateString(dateString) {
  const parts = dateString.split("/");
  // Kiểm tra định dạng trước khi chuyển đổi
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0"); // Thêm 0 vào trước nếu cần
    const month = parts[1].padStart(2, "0"); // Thêm 0 vào trước nếu cần
    const year = parts[2];
    return `${day}/${month}/${year}`; // Trả về định dạng "yyyy-MM-dd"
  }
  return dateString; // Trả về giá trị ban đầu nếu không đúng định dạng
}
