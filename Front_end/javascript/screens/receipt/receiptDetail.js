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

async function fetchReceiptDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuNhap = urlParams.get("id");

  console.log("Mã phiếu nhập:", maPhieuNhap);

  try {
    const response = await fetch(
      `http://localhost:3000/api/phieunhap/${maPhieuNhap}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết phiếu nhập.");
    }

    const textResponse = await response.text(); // Lấy phản hồi dưới dạng chuỗi
    const receipt = JSON.parse(textResponse); // Phân tích cú pháp nếu cần

    const detailsContainer = document.getElementById("receipt-details");

    if (!detailsContainer) {
      throw new Error("Phần tử receipt-details không tồn tại.");
    }

    // Tải danh sách sản phẩm, đơn vị tính, nhà cung cấp, và nhân viên
    const [products, units, suppliers, employees] = await Promise.all([
      loadProducts(),
      loadUnitOfMeasurement(),
      loadSuppliers(),
      loadEmployees(),
    ]);

    document.getElementById("receipt-id").textContent = receipt.MaPhieuNhap;

    // Tìm tên nhà cung cấp trong danh sách
    const supplier = suppliers.find(
      (s) => s.MaNhaCungCap === receipt.MaNhaCungCap
    );
    const supplierName = supplier ? supplier.TenNhaCungCap : "Không tìm thấy";
    document.getElementById("supplier").value = supplierName;

    // Tìm tên nhân viên trong danh sách
    const employee = employees.find((e) => e.MaNhanVien === receipt.MaNhanVien);
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    // Hiển thị danh sách sản phẩm
    let productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    receipt.SanPhamList.forEach((product) => {
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
                <td>${product.GiaSanPham}</td>
            `;
      productList.appendChild(row);
    });

    // Cập nhật thông tin khác vào side-panel
    document.getElementById("date").value = new Date(
      receipt.NgayNhap
    ).toLocaleDateString();
    document.getElementById("total-price").value = receipt.TongGiaTri;
    document.getElementById("description").value = receipt.MoTa;
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
    const detailsContainer = document.getElementById("receipt-details");
    if (detailsContainer) {
      detailsContainer.innerHTML = "<p>Không thể tải chi tiết phiếu nhập.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchReceiptDetails);

function cancel() {
  // Quay về trang trước
  window.history.back();
}
