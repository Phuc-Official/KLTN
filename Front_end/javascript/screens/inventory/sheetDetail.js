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

async function fetchInventoryCheckDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuKiemKe = urlParams.get("id");

  console.log("Mã phiếu kiểm kê:", maPhieuKiemKe);

  try {
    const response = await fetch(
      `http://localhost:3000/api/phieukiemke/${maPhieuKiemKe}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết phiếu kiểm kê.");
    }

    const textResponse = await response.text(); // Lấy phản hồi dưới dạng chuỗi
    const inventoryCheck = JSON.parse(textResponse); // Phân tích cú pháp nếu cần

    console.log("Chi tiết phiếu kiểm kê:", inventoryCheck); // Log chi tiết phiếu kiểm kê

    const detailsContainer = document.getElementById("inventory-details");

    if (!detailsContainer) {
      throw new Error("Phần tử inventory-details không tồn tại.");
    }

    // Tải danh sách sản phẩm, đơn vị tính, và nhân viên
    const [products, units, employees] = await Promise.all([
      loadProducts(),
      loadUnitOfMeasurement(),
      loadEmployees(),
    ]);

    // Tìm tên nhân viên trong danh sách
    const employee = employees.find(
      (e) => e.MaNhanVien === inventoryCheck.MaNhanVien
    );
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    // Hiển thị danh sách sản phẩm
    let productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    inventoryCheck.SanPhamList.forEach((product) => {
      const foundProduct = products.find(
        (p) => p.MaSanPham === product.MaSanPham
      );
      const unit = units.find((u) => u.MaDonVi === product.MaDonVi);

      const productName = foundProduct
        ? foundProduct.TenSanPham
        : "Không tìm thấy";
      const unitName = unit ? unit.TenDonVi : "Không tìm thấy";

      // Tính toán số lượng tồn theo đơn vị
      const quantityInBaseUnit = foundProduct
        ? Math.floor(foundProduct.SoLuongTon / (unit ? unit.TyleQuyDoi : 1)) // Làm tròn
        : 0;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${product.MaSanPham}</td>
                <td>${productName}</td>
                <td>${unitName}</td>
                <td>${quantityInBaseUnit} </td> <!-- Hiển thị số lượng tồn tính toán -->
                <td>${
                  product.SoLuongThucTe || 0
                }</td> <!-- Hiển thị số lượng thực tế -->
            `;
      productList.appendChild(row);
    });

    // Cập nhật thông tin khác vào side-panel
    document.getElementById("date").value = new Date(
      inventoryCheck.NgayTao
    ).toLocaleDateString();
    document.getElementById("description").value = inventoryCheck.MoTa;
    document.getElementById("sheet-name").value =
      inventoryCheck.TenPhieu || "Không tìm thấy";
    document.getElementById("sheet-id").value =
      inventoryCheck.MaPhieuKiemKe || "Không tìm thấy";
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phiếu kiểm kê:", error);
    const detailsContainer = document.getElementById("inventory-details");
    if (detailsContainer) {
      detailsContainer.innerHTML =
        "<p>Không thể tải chi tiết phiếu kiểm kê.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchInventoryCheckDetails);

function cancel() {
  // Quay về trang trước
  window.history.back();
}

document.addEventListener("DOMContentLoaded", fetchInventoryCheckDetails);

function cancel() {
  // Quay về trang trước
  window.history.back();
}
