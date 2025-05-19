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

async function fetchProductUnits(maSanPham) {
  try {
    const response = await fetch(`${BACKEND_URL}/donvitinhkhac/${maSanPham}`);
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách đơn vị cho sản phẩm");
    }
    const units = await response.json();
    console.log(`Đơn vị cho sản phẩm ${maSanPham}:`, units); // In ra để kiểm tra
    return units;
  } catch (error) {
    console.error(`Lỗi khi lấy đơn vị cho sản phẩm ${maSanPham}:`, error);
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
    const response = await fetch(`${BACKEND_URL}/donhang/${maDonHang}`);
    if (!response.ok) {
      throw new Error("Không thể tải chi tiết đơn hàng.");
    }

    order = await response.json();

    // Tải các dữ liệu cần thiết
    const [products, suppliers, employees] = await Promise.all([
      loadProducts(),
      loadSuppliers(),
      loadEmployees(),
    ]);

    document.getElementById("order-id").textContent = order.MaDonHang;

    // Xử lý nhà cung cấp
    const supplier = suppliers.find(
      (s) => s.MaNhaCungCap === order.MaNhaCungCap
    );
    selectedSupplierId = supplier?.MaNhaCungCap || null;
    document.getElementById("supplier").value =
      supplier?.TenNhaCungCap || "Không tìm thấy";

    // Xử lý nhân viên
    const employee = employees.find((e) => e.MaNhanVien === order.MaNhanVien);
    selectedEmployeeId = employee?.MaNhanVien || null;
    document.getElementById("employee").value =
      employee?.TenNhanVien || "Không tìm thấy";

    // Hiển thị danh sách sản phẩm với đơn vị từ DonViKhac
    const productList = document.getElementById("product-list");
    productList.innerHTML = ""; // Xóa nội dung cũ

    // Duyệt qua từng sản phẩm trong đơn hàng
    for (const product of order.SanPhamList) {
      const foundProduct = products.find(
        (p) => p.MaSanPham === product.MaSanPham
      );
      const productName = foundProduct?.TenSanPham || "Không tìm thấy";

      // Lấy danh sách đơn vị từ DonViKhac cho sản phẩm này
      const productUnits = await fetchProductUnits(product.MaSanPham);

      // Log ra đơn vị theo ID đơn vị của sản phẩm
      const matchedUnit = productUnits.find(
        (u) => u.ID === product.MaDonViKhac
      ); // Sử dụng MaDonViKhac
      console.log(
        `Đơn vị cho sản phẩm ${product.MaSanPham} (ID: ${product.MaDonViKhac}):`,
        matchedUnit
      );

      const unitName = matchedUnit?.TenDonVi || "Không tìm thấy";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.MaSanPham}</td>
        <td>${productName}</td>
        <td>${unitName}</td>
        <td>${product.SoLuong}</td>
      `;
      productList.appendChild(row);
    }

    // Cập nhật thông tin khác
    document.getElementById("date").value = formatDateToDDMMYYYY(
      order.NgayNhap
    );

    document.getElementById("description").value = order.MoTa || "";

    // document.getElementById("status").value = order.TrangThai || "Chờ xử lý";

    const statusDisplay = document.getElementById("order-status");
    if (statusDisplay) {
      const status = order.TrangThai || "Chờ xử lý";
      statusDisplay.textContent = ` ${status}`;

      // Gán màu theo trạng thái
      switch (status) {
        case "Đã nhập":
          statusDisplay.style.color = "green";
          break;
        default:
          statusDisplay.style.color = "gray"; // các trạng thái khác
      }
    }
    const addReceiptBtn = document.getElementById("add-receipt-button");
    if (addReceiptBtn) {
      if (order.TrangThai === "Đã nhập") {
        addReceiptBtn.style.display = "none";
      } else {
        addReceiptBtn.style.display = "inline-block"; // hoặc "" để hiện lại nếu muốn
      }
    }
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
  .addEventListener("click", async function () {
    const orderId = document.getElementById("order-id").textContent.trim();
    const date = document.getElementById("date").value.trim();
    const description = document.getElementById("description").value.trim();

    // Lấy danh sách sản phẩm với đơn vị từ DonViKhac
    const selectedProducts = [];
    const productRows = document.querySelectorAll("#product-list tr");

    for (const row of productRows) {
      const maSanPham = row.cells[0].textContent.trim();
      const tenSanPham = row.cells[1].textContent.trim();
      const soLuong = row.cells[3].textContent.trim();

      // Lấy thông tin đơn vị từ DonViKhac
      const productUnits = await fetchProductUnits(maSanPham);
      const orderProduct = order.SanPhamList.find(
        (p) => p.MaSanPham === maSanPham
      );
      const matchedUnit = productUnits.find(
        (u) => u.ID === orderProduct.MaDonViKhac
      );

      selectedProducts.push({
        MaSanPham: maSanPham,
        TenSanPham: tenSanPham,
        SoLuong: soLuong,
        MaDonViKhac: orderProduct.MaDonViKhac,
        TenDonVi: matchedUnit?.TenDonVi || "Không xác định",
        TyLeQuyDoi: matchedUnit?.TyLeQuyDoi || 1,
      });
    }

    // Chuyển đổi danh sách sản phẩm thành chuỗi JSON
    const selectedProductsJson = encodeURIComponent(
      JSON.stringify(selectedProducts)
    );

    const createReceiptUrl =
      `confirmReceipt.html?orderId=${encodeURIComponent(orderId)}` +
      `&supplier=${encodeURIComponent(selectedSupplierId)}` +
      `&employee=${encodeURIComponent(selectedEmployeeId)}` +
      `&date=${encodeURIComponent(date)}` +
      `&description=${encodeURIComponent(description)}` +
      `&products=${selectedProductsJson}`;

    window.location.href = createReceiptUrl;
  });

document
  .getElementById("delete-button")
  .addEventListener("click", async function () {
    const orderId = document.getElementById("order-id").textContent.trim();

    if (!orderId) {
      alert("Không xác định được mã đơn hàng để xóa.");
      return;
    }

    // Xác nhận lại với người dùng trước khi xóa
    const confirmDelete = confirm(
      `Bạn có chắc muốn xóa đơn hàng ${orderId} không?`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${BACKEND_URL}/donhang/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Xóa đơn hàng thất bại.");
      }

      alert(`Đơn hàng ${orderId} đã được xóa thành công.`);
      // Có thể chuyển về trang danh sách đơn hàng hoặc trang trước đó
      window.location.href = "orderList.html"; // hoặc trang bạn muốn chuyển đến
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng:", error);
      alert("Đã xảy ra lỗi khi xóa đơn hàng. Vui lòng thử lại.");
    }
  });

function formatDateToDDMMYYYY(dateInput) {
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
