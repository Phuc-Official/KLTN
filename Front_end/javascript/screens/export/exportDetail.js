async function fetchUnitName(donViKhacId) {
  if (!donViKhacId) return "Không tìm thấy";
  try {
    const response = await fetch(
      `${BACKEND_URL}/donvikhac/by-id/${donViKhacId}`
    );
    if (!response.ok) throw new Error("Không thể lấy tên đơn vị khác.");
    const unit = await response.json();
    return unit.TenDonVi || "Không tìm thấy";
  } catch (error) {
    console.error("Lỗi khi lấy tên đơn vị khác:", error);
    return "Không tìm thấy";
  }
}

async function loadCustomers() {
  try {
    const response = await fetch(`${BACKEND_URL}/khachhang`);
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách khách hàng");
    }
    const customers = await response.json();
    return customers;
  } catch (error) {
    console.error("Lỗi khi tải khách hàng:", error);
    return [];
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham`);
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách sản phẩm");
    }
    const products = await response.json();
    return products;
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
    return [];
  }
}

async function loadEmployees() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien`);
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

async function fetchExportDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuXuat = urlParams.get("id");

  console.log("Mã phiếu xuất:", maPhieuXuat);

  try {
    const response = await fetch(`${BACKEND_URL}/phieuxuat/${maPhieuXuat}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết phiếu xuất.");
    }

    const textResponse = await response.text();
    const exports = JSON.parse(textResponse);

    const detailsContainer = document.getElementById("export-details");
    if (!detailsContainer) {
      throw new Error("Phần tử export-details không tồn tại.");
    }

    const [products, customers, employees] = await Promise.all([
      loadProducts(),
      loadCustomers(),
      loadEmployees(),
    ]);

    document.getElementById("export-id").textContent = exports.MaPhieuXuat;

    const customer = customers.find(
      (c) => c.MaKhachHang === exports.MaKhachHang
    );
    const customerName = customer ? customer.TenKhachHang : "Không tìm thấy";
    document.getElementById("customer").value = customerName;

    const employee = employees.find((e) => e.MaNhanVien === exports.MaNhanVien);
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    let productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    for (const product of exports.SanPhamList) {
      const foundProduct = products.find(
        (p) => p.MaSanPham === product.MaSanPham
      );
      const productName = foundProduct
        ? foundProduct.TenSanPham
        : "Không tìm thấy";

      const unitName = await fetchUnitName(product.MaDonViKhac);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.MaSanPham}</td>
        <td>${productName}</td>
        <td>${unitName}</td>
        <td>${product.SoLuong}</td>
      `;
      productList.appendChild(row);
    }

    document.getElementById("date").value = new Date(
      exports.NgayXuat
    ).toLocaleDateString();
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
  window.history.back();
}
