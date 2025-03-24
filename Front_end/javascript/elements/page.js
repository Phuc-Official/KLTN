let currentPage = 1;
const productsPerPage = 10;
let products = []; // Mảng chứa tất cả sản phẩm

async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:3000/api/sanpham");
    products = await response.json(); // Lưu trữ sản phẩm vào mảng

    displayProducts(); // Gọi để hiển thị sản phẩm sau khi lấy được
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
  }
}

// Hàm để hiển thị sản phẩm theo trang
function displayProducts() {
  const container = document.querySelector("#sanpham-container tbody");
  container.innerHTML = ""; // Xóa nội dung cũ

  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = products.slice(start, end);

  paginatedProducts.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${product.MaSanPham}</td>
        <td>${product.TenSanPham}</td>
        <td>${product.TenNhom || "Không xác định"}</td>
        <td>${product.SoLuongTon}</td>
    `;
    row.addEventListener("click", () => {
      viewProductDetails(product.MaSanPham);
    });
    container.appendChild(row);
  });

  updatePagination(); // Cập nhật trạng thái phân trang
}

// Cập nhật trạng thái các nút phân trang
function updatePagination() {
  const pageNumbersContainer = document.getElementById("page-numbers");
  pageNumbersContainer.innerHTML = ""; // Xóa nội dung cũ

  const totalPages = Math.ceil(products.length / productsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = "page-button";
    pageButton.onclick = () => {
      currentPage = i;
      displayProducts(); // Hiển thị sản phẩm của trang đã chọn
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
function changePage(direction) {
  // Cập nhật trang hiện tại
  currentPage += direction;

  // Đảm bảo trang không vượt quá giới hạn
  if (currentPage < 1) {
    currentPage = 1; // Không cho phép quay về trang trước
  } else if (currentPage > Math.ceil(products.length / productsPerPage)) {
    currentPage = Math.ceil(products.length / productsPerPage); // Không cho phép vượt quá trang cuối
  }

  displayProducts(); // Hiển thị sản phẩm của trang đã chọn
  updatePagination(); // Cập nhật trạng thái của các nút phân trang
}

// Gọi hàm khi trang được tải
fetchProducts();
