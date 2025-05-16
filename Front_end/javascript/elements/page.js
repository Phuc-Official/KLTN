let currentPage = 1;
let currentOrderPage = 1; // Biến cho trang đơn hàng
const productsPerPage = 10;
const receiptsPerPage = 10;
const exportsPerPage = 10;
const inventoriesPerPage = 10; // Số lượng phiếu kiểm kê mỗi trang
const ordersPerPage = 10; // Số lượng đơn hàng mỗi trang
const sheetPerPage = 10;

let products = [];
let receipts = [];
let exports = [];
let inventories = []; // Mảng chứa tất cả phiếu kiểm kê
let orders = []; // Mảng chứa đơn hàng
let sheets = [];

async function fetchProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham`);
    products = await response.json();
    displayItems("product");
  } catch (error) {
    // console.error("Lỗi khi tải sản phẩm:", error);
  }
}

async function fetchReceipts() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieunhap`);
    receipts = await response.json();
    displayItems("receipt");
  } catch (error) {
    // console.error("Lỗi khi tải phiếu nhập:", error);
  }
}

async function fetchExports() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieuxuat`);
    exports = await response.json();
    displayItems("export");
  } catch (error) {
    // console.error("Lỗi khi tải phiếu xuất:", error);
  }
}

async function fetchInventories() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieukiemke`);
    inventories = await response.json();
    displayItems("inventory");
  } catch (error) {
    // console.error("Lỗi khi tải phiếu kiểm kê:", error);
  }
}

async function fetchOrders() {
  try {
    const response = await fetch(`${BACKEND_URL}/donhang`);
    orders = await response.json();
    displayItems("order"); // Hiển thị đơn hàng
  } catch (error) {
    // console.error("Lỗi khi tải đơn hàng:", error);
  }
}

async function fetchInventories() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieukiemke`);
    inventories = await response.json();
    displayItems("inventory");
  } catch (error) {
    // console.error("Lỗi khi tải phiếu kiểm kê:", error);
  }
}

// Hàm để hiển thị sản phẩm, phiếu nhập, phiếu xuất, phiếu kiểm kê hoặc đơn hàng theo trang
function displayItems(type) {
  const container = document.querySelector(`#${type}-container tbody`);
  container.innerHTML = ""; // Xóa nội dung cũ

  const items =
    type === "product"
      ? products
      : type === "receipt"
      ? receipts
      : type === "export"
      ? exports
      : type === "inventory"
      ? inventories
      : orders; // Chọn mảng dựa trên loại

  const itemsPerPage =
    type === "product"
      ? productsPerPage
      : type === "receipt"
      ? receiptsPerPage
      : type === "export"
      ? exportsPerPage
      : type === "inventory"
      ? inventoriesPerPage
      : ordersPerPage; // Số lượng trên mỗi trang

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = items.slice(start, end);

  paginatedItems.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML =
      type === "product"
        ? `
                <td>${item.MaSanPham}</td>
                <td>${item.TenSanPham}</td>
                <td>${item.TenNhom || ""}</td>
            `
        : type === "receipt"
        ? `
                <td>${item.MaPhieuNhap}</td>
                <td>${item.TenNhaCungCap}</td>
                <td>${item.TenNhanVien || ""}</td>
                <td>${formatDate(item.NgayNhap)}</td>
            `
        : type === "export"
        ? `
                <td>${item.MaPhieuXuat}</td>
                <td>${item.TenKhachHang}</td>
                <td>${item.TenNhanVien || ""}</td>
                <td>${formatDate(item.NgayXuat)}</td>
            `
        : type === "inventory"
        ? `
                <td>${item.MaPhieuKiemKe}</td>
                <td>${item.TenPhieu || ""}</td>
                <td>${item.TenNhanVien || ""}</td>
                <td>${item.NgayTao ? formatDate(item.NgayTao) : ""}</td>
            `
        : `
                <td>${item.MaDonHang}</td>
                <td>${item.TenNhaCungCap}</td>
                <td>${item.TenNhanVien}</td>
                <td>${formatDate(item.NgayNhap)}</td>
            `;

    row.addEventListener("click", () => {
      if (type === "product") {
        viewProductDetails(item.MaSanPham);
      } else if (type === "receipt") {
        viewReceiptDetails(item.MaPhieuNhap);
      } else if (type === "export") {
        viewExportDetails(item.MaPhieuXuat);
      } else if (type === "inventory") {
        viewSheetDetails(item.MaPhieuKiemKe); // Hàm hiển thị chi tiết phiếu kiểm kê
      } else {
        viewOrderDetails(item.MaDonHang); // Hàm hiển thị chi tiết đơn hàng
      }
    });
    container.appendChild(row);
  });

  updatePagination(type); // Cập nhật trạng thái phân trang
}

// Cập nhật trạng thái các nút phân trang
function updatePagination(type) {
  const pageNumbersContainer = document.getElementById("page-numbers");

  pageNumbersContainer.innerHTML = ""; // Xóa nội dung cũ

  const items =
    type === "product"
      ? products
      : type === "receipt"
      ? receipts
      : type === "export"
      ? exports
      : type === "inventory"
      ? inventories
      : orders; // Chọn mảng dựa trên loại
  const totalPages = Math.ceil(
    items.length /
      (type === "product"
        ? productsPerPage
        : type === "receipt"
        ? receiptsPerPage
        : type === "export"
        ? exportsPerPage
        : type === "inventory"
        ? inventoriesPerPage
        : ordersPerPage)
  );

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "page-button";
    pageButton.onclick = () => {
      currentPage = i;
      displayItems(type); // Hiển thị sản phẩm, phiếu nhập, phiếu xuất hoặc phiếu kiểm kê của trang đã chọn
    };

    // Đánh dấu nút hiện tại
    if (i === currentPage) {
      pageButton.classList.add("active");
    }

    pageNumbersContainer.appendChild(pageButton);
  }

  // Quản lý trạng thái của các nút mũi tên
  document.getElementById("prev-page").disabled = currentPage === 1;
  document.getElementById("next-page").disabled = currentPage === totalPages;
}

function changePage(direction, type) {
  // Cập nhật trang hiện tại
  currentPage += direction;

  // Đảm bảo trang không vượt quá giới hạn
  if (currentPage < 1) {
    currentPage = 1; // Không cho phép quay về trang trước
  } else if (
    currentPage >
    Math.ceil(
      (type === "product"
        ? products.length
        : type === "receipt"
        ? receipts.length
        : exports.length) /
        (type === "product"
          ? productsPerPage
          : type === "receipt"
          ? receiptsPerPage
          : exportsPerPage)
    )
  ) {
    currentPage = Math.ceil(
      (type === "product"
        ? products.length
        : type === "receipt"
        ? receipts.length
        : exports.length) /
        (type === "product"
          ? productsPerPage
          : type === "receipt"
          ? receiptsPerPage
          : exportsPerPage)
    ); // Không cho phép vượt quá trang cuối
  }

  displayItems(type); // Hiển thị sản phẩm, phiếu nhập hoặc phiếu xuất của trang đã chọn
  updatePagination(type); // Cập nhật trạng thái của các nút phân trang
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`; // Trả về định dạng dd/mm/yyyy
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  fetchReceipts(); // Gọi để lấy phiếu nhập
  fetchExports(); // Gọi để lấy phiếu xuất
  fetchInventories(); // Gọi để lấy phiếu kiểm kê
  fetchOrders(); // Gọi để lấy đơn hàng
});
