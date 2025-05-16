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

async function loadProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham`);
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

async function loadSuppliers() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhacungcap`);
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

async function fetchReceiptDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuNhap = urlParams.get("id");

  console.log("Mã phiếu nhập:", maPhieuNhap);

  try {
    const response = await fetch(`${BACKEND_URL}/phieunhap/${maPhieuNhap}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết phiếu nhập.");
    }

    const textResponse = await response.text();
    const receipt = JSON.parse(textResponse);

    const detailsContainer = document.getElementById("receipt-details");
    if (!detailsContainer) {
      throw new Error("Phần tử receipt-details không tồn tại.");
    }

    // Chỉ tải sản phẩm, nhà cung cấp, nhân viên
    const [products, suppliers, employees] = await Promise.all([
      loadProducts(),
      loadSuppliers(),
      loadEmployees(),
    ]);

    document.getElementById("receipt-id").textContent = receipt.MaPhieuNhap;

    const supplier = suppliers.find(
      (s) => s.MaNhaCungCap === receipt.MaNhaCungCap
    );
    const supplierName = supplier ? supplier.TenNhaCungCap : "Không tìm thấy";
    document.getElementById("supplier").value = supplierName;

    const employee = employees.find((e) => e.MaNhanVien === receipt.MaNhanVien);
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    let productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    for (const product of receipt.SanPhamList) {
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
      receipt.NgayNhap
    ).toLocaleDateString();
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
  window.history.back();
}
