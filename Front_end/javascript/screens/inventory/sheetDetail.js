async function loadProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham`);
    if (!response.ok) throw new Error("Không thể lấy danh sách sản phẩm");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
    return [];
  }
}

async function loadEmployees() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien`);
    if (!response.ok) throw new Error("Không thể lấy danh sách nhân viên");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải nhân viên:", error);
    return [];
  }
}

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

async function fetchInventoryCheckDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maPhieuKiemKe = urlParams.get("id");
  console.log("Mã phiếu kiểm kê:", maPhieuKiemKe);

  try {
    const response = await fetch(`${BACKEND_URL}/phieukiemke/${maPhieuKiemKe}`);
    if (!response.ok) throw new Error("Không thể tải chi tiết phiếu kiểm kê.");
    const inventoryCheck = await response.json();
    console.log("Chi tiết phiếu kiểm kê:", inventoryCheck);

    const [products, employees] = await Promise.all([
      loadProducts(),
      loadEmployees(),
    ]);

    const employee = employees.find(
      (e) => e.MaNhanVien === inventoryCheck.MaNhanVien
    );
    const employeeName = employee ? employee.TenNhanVien : "Không tìm thấy";
    document.getElementById("employee").value = employeeName;

    const productList = document.getElementById("product-list");
    if (!productList) {
      console.error("Phần tử product-list không tồn tại.");
      return;
    }

    // === Gom nhóm sản phẩm theo MaSanPham ===
    const groupedProducts = {};
    for (const product of inventoryCheck.SanPhamList) {
      if (!groupedProducts[product.MaSanPham]) {
        groupedProducts[product.MaSanPham] = [];
      }
      groupedProducts[product.MaSanPham].push(product);
    }

    for (const [maSanPham, productGroup] of Object.entries(groupedProducts)) {
      const foundProduct = products.find((p) => p.MaSanPham === maSanPham);
      const productName = foundProduct
        ? foundProduct.TenSanPham
        : "Không tìm thấy";

      for (let i = 0; i < productGroup.length; i++) {
        const product = productGroup[i];
        const unitName = await fetchUnitName(product.MaDonViKhac);
        const quantityInBaseUnit = product.SoLuongTon || 0;

        const row = document.createElement("tr");
        row.innerHTML = `
          ${
            i === 0
              ? `<td rowspan="${productGroup.length}">${maSanPham}</td>`
              : ""
          }
          ${
            i === 0
              ? `<td rowspan="${productGroup.length}">${productName}</td>`
              : ""
          }
          <td>${unitName}</td>
          <td>${quantityInBaseUnit}</td>
          <td>${product.SoLuongThucTe || 0}</td>
        `;
        productList.appendChild(row);
      }
    }

    document.getElementById("date").value = new Date(
      inventoryCheck.NgayTao
    ).toLocaleDateString();
    document.getElementById("description").value = inventoryCheck.MoTa || "";
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

function cancel() {
  window.history.back();
}

document.addEventListener("DOMContentLoaded", fetchInventoryCheckDetails);
