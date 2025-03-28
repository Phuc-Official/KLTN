let currentPage = 1;
const productsPerPage = 10;
const receiptsPerPage = 10; // Thay đổi số lượng phiếu nhập mỗi trang
let products = []; // Mảng chứa tất cả sản phẩm
let receipts = []; // Mảng chứa tất cả phiếu nhập

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

// Hàm để hiển thị sản phẩm hoặc phiếu nhập theo trang
function displayItems(type) {
  console.log("Displaying items for type:", type); // Kiểm tra loại
  const container = document.querySelector(`#${type}-container tbody`);
  container.innerHTML = ""; // Xóa nội dung cũ

  const items = type === "product" ? products : receipts; // Chọn mảng dựa trên loại
  const itemsPerPage = type === "product" ? productsPerPage : receiptsPerPage; // Số lượng trên mỗi trang

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
        <td>${item.SoLuongTon}</td>
    `
        : `
        <td>${item.MaPhieuNhap}</td>
        <td>${item.TenNhaCungCap}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${formatDate(item.NgayNhap)}</td>
    `;

    row.addEventListener("click", () => {
      if (type === "product") {
        viewProductDetails(item.MaSanPham);
      } else {
        viewReceiptDetails(item.MaPhieuNhap);
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

  const items = type === "product" ? products : receipts; // Chọn mảng dựa trên loại
  const totalPages = Math.ceil(
    items.length / (type === "product" ? productsPerPage : receiptsPerPage)
  );

  console.log("Total pages for type:", type, totalPages); // Kiểm tra tổng số trang

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "page-button";
    pageButton.onclick = () => {
      currentPage = i;
      displayItems(type); // Hiển thị sản phẩm hoặc phiếu nhập của trang đã chọn
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
      (type === "product" ? products.length : receipts.length) /
        (type === "product" ? productsPerPage : receiptsPerPage)
    )
  ) {
    currentPage = Math.ceil(
      (type === "product" ? products.length : receipts.length) /
        (type === "product" ? productsPerPage : receiptsPerPage)
    ); // Không cho phép vượt quá trang cuối
  }

  displayItems(type); // Hiển thị sản phẩm hoặc phiếu nhập của trang đã chọn
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
});
