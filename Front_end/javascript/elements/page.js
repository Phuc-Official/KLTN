let currentPage = 1;
const productsPerPage = 10;
const receiptsPerPage = 10; // Số lượng phiếu nhập mỗi trang
const exportsPerPage = 10; // Số lượng phiếu xuất mỗi trang
let products = []; // Mảng chứa tất cả sản phẩm
let receipts = []; // Mảng chứa tất cả phiếu nhập
let exports = []; // Mảng chứa tất cả phiếu xuất

async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:3000/api/sanpham");
    products = await response.json(); // Lưu trữ sản phẩm vào mảng
    displayItems("product"); // Gọi để hiển thị sản phẩm sau khi lấy được
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
  }
}

async function fetchReceipts() {
  try {
    const response = await fetch("http://localhost:3000/api/phieunhap");
    receipts = await response.json(); // Lưu trữ phiếu nhập vào mảng
    displayItems("receipt"); // Gọi để hiển thị phiếu nhập sau khi lấy được
  } catch (error) {
    console.error("Lỗi khi tải phiếu nhập:", error);
  }
}

async function fetchExports() {
  try {
    const response = await fetch("http://localhost:3000/api/phieuxuat");
    exports = await response.json(); // Lưu trữ phiếu xuất vào mảng
    displayItems("export"); // Gọi để hiển thị phiếu xuất sau khi lấy được
  } catch (error) {
    console.error("Lỗi khi tải phiếu xuất:", error);
  }
}

// Hàm để hiển thị sản phẩm, phiếu nhập hoặc phiếu xuất theo trang
function displayItems(type) {
  const container = document.querySelector(`#${type}-container tbody`);
  container.innerHTML = ""; // Xóa nội dung cũ

  const items =
    type === "product" ? products : type === "receipt" ? receipts : exports; // Chọn mảng dựa trên loại
  const itemsPerPage =
    type === "product"
      ? productsPerPage
      : type === "receipt"
      ? receiptsPerPage
      : exportsPerPage; // Số lượng trên mỗi trang

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
        <td>${item.SoLuongTon !== null ? item.SoLuongTon : 0}</td>
    `
        : type === "receipt"
        ? `
        <td>${item.MaPhieuNhap}</td>
        <td>${item.TenNhaCungCap}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${formatDate(item.NgayNhap)}</td>
    `
        : `
        <td>${item.MaPhieuXuat}</td>
        <td>${item.TenKhachHang}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${formatDate(item.NgayXuat)}</td>
    `;

    row.addEventListener("click", () => {
      if (type === "product") {
        viewProductDetails(item.MaSanPham);
      } else if (type === "receipt") {
        viewReceiptDetails(item.MaPhieuNhap);
      } else {
        viewExportDetails(item.MaPhieuXuat); // Hàm hiển thị chi tiết phiếu xuất
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
    type === "product" ? products : type === "receipt" ? receipts : exports; // Chọn mảng dựa trên loại
  const totalPages = Math.ceil(
    items.length /
      (type === "product"
        ? productsPerPage
        : type === "receipt"
        ? receiptsPerPage
        : exportsPerPage)
  );

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "page-button";
    pageButton.onclick = () => {
      currentPage = i;
      displayItems(type); // Hiển thị sản phẩm, phiếu nhập hoặc phiếu xuất của trang đã chọn
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
  const day = String(date.getDate()).padStart(2, "0"); // Lấy ngày và thêm số 0 ở phía trước nếu cần
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng (0-11) nên cần cộng 1
  const year = date.getFullYear(); // Năm

  return `${day}/${month}/${year}`; // Trả về định dạng dd/mm/yyyy
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  fetchReceipts(); // Gọi để lấy phiếu nhập
  fetchExports(); // Gọi để lấy phiếu xuất
});
