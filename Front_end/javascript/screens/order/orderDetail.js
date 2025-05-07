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

async function fetchProductUnits(maSanPham) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvitinhkhac/${maSanPham}`
    );
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
    const response = await fetch(
      `http://localhost:3000/api/donhang/${maDonHang}`
    );
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
    document.getElementById("date").value = new Date(
      order.NgayNhap
    ).toLocaleDateString();
    document.getElementById("description").value = order.MoTa || "";
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
