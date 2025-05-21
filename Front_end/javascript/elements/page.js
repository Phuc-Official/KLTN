const state = {
  product: {
    currentPage: 1,
    perPage: 10,
    data: [],
    searchInputId: "searchInput",
    limitInputId: "limitInput",
  },
  receipt: {
    currentPage: 1,
    perPage: 10,
    data: [],
    searchInputId: "searchReceiptInput",
  },
  export: {
    currentPage: 1,
    perPage: 10,
    data: [],
    searchInputId: "searchExportInput",
  },
  inventory: {
    currentPage: 1,
    perPage: 10,
    data: [],
    searchInputId: "searchInventoryInput",
  },
  order: {
    currentPage: 1,
    perPage: 10,
    data: [],
    searchInputId: "searchOrderInput",
  },
};

async function fetchData(type, url) {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Lỗi tải dữ liệu ${type}: ${response.statusText}`);
    state[type].data = await response.json();
    displayItems(type);
  } catch (error) {
    console.error(error);
  }
}

function getSearchKeyword(type) {
  return (
    document.getElementById(state[type].searchInputId)?.value.toLowerCase() ||
    ""
  );
}

function displayItems(type) {
  const { currentPage, perPage, data } = state[type];
  const keyword = getSearchKeyword(type);

  let filtered = [];

  switch (type) {
    case "product":
      const limitVal = parseFloat(
        document.getElementById(state.product.limitInputId)?.value
      );
      filtered = data.filter((item) => {
        const matchKeyword =
          item.MaSanPham?.toLowerCase().includes(keyword) ||
          item.TenSanPham?.toLowerCase().includes(keyword) ||
          item.TenNhom?.toLowerCase().includes(keyword);
        const matchLimit =
          isNaN(limitVal) ||
          (item.SoLuongTon !== undefined && item.SoLuongTon <= limitVal);
        return matchKeyword && matchLimit;
      });
      break;

    case "receipt":
      filtered = data.filter(
        (item) =>
          item.MaPhieuNhap?.toLowerCase().includes(keyword) ||
          item.TenNhaCungCap?.toLowerCase().includes(keyword)
      );
      break;

    case "export":
      filtered = data.filter(
        (item) =>
          item.MaPhieuXuat?.toLowerCase().includes(keyword) ||
          item.TenKhachHang?.toLowerCase().includes(keyword)
      );
      break;

    case "inventory":
      filtered = data.filter(
        (item) =>
          item.MaPhieuKiemKe?.toLowerCase().includes(keyword) ||
          item.TenPhieu?.toLowerCase().includes(keyword) ||
          item.TenNhanVien?.toLowerCase().includes(keyword)
      );
      break;

    case "order":
      filtered = data.filter((item) => {
        const maPhieu = item.MaDonHang?.toLowerCase() || "";
        const nhaCungCap = item.TenNhaCungCap?.toLowerCase() || "";
        const nhanVien = item.TenNhanVien?.toLowerCase() || "";
        return (
          maPhieu.includes(keyword) ||
          nhaCungCap.includes(keyword) ||
          nhanVien.includes(keyword)
        );
      });
      break;
  }

  const startIndex = (currentPage - 1) * perPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + perPage);

  const tbody = document.querySelector(`#${type}-container tbody`);
  if (!tbody) return; // phòng trường hợp chưa có phần tử

  tbody.innerHTML = "";
  //
  paginatedItems.forEach((item) => {
    const row = document.createElement("tr");

    if (type === "product") {
      row.innerHTML = `
        <td>${item.MaSanPham}</td>
        <td>${item.TenSanPham}</td>
        <td>${item.TenNhom || ""}</td>
        <td>${item.SoLuongTon ?? 0}</td> 
        <td>${item.SoLuongTon ?? 0}</td>
      `;
    } else if (type === "receipt") {
      row.innerHTML = `
        <td>${item.MaPhieuNhap}</td>
        <td>${item.TenNhaCungCap}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${formatDate(item.NgayNhap)}</td>
      `;
    } else if (type === "export") {
      row.innerHTML = `
        <td>${item.MaPhieuXuat}</td>
        <td>${item.TenKhachHang}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${formatDate(item.NgayXuat)}</td>
      `;
    } else if (type === "inventory") {
      row.innerHTML = `
        <td>${item.MaPhieuKiemKe}</td>
        <td>${item.TenPhieu || ""}</td>
        <td>${item.TenNhanVien || ""}</td>
        <td>${item.NgayTao ? formatDate(item.NgayTao) : ""}</td>
      `;
    } else if (type === "order") {
      row.innerHTML = `
        <td>${item.MaDonHang}</td>
        <td>${item.TenNhaCungCap}</td>
        <td>${item.TenNhanVien}</td>
        <td>${formatDate(item.NgayNhap)}</td>
        <td>${item.TrangThai}</td>
      `;
    }

    row.addEventListener("click", () => {
      switch (type) {
        case "product":
          viewProductDetails(item.MaSanPham);
          break;
        case "receipt":
          viewReceiptDetails(item.MaPhieuNhap);
          break;
        case "export":
          viewExportDetails(item.MaPhieuXuat);
          break;
        case "inventory":
          viewSheetDetails(item.MaPhieuKiemKe);
          break;
        case "order":
          viewOrderDetails(item.MaDonHang);
          break;
      }
    });

    tbody.appendChild(row);
  });

  updatePagination(type, filtered.length);
}

function updatePagination(type, totalItems) {
  const container = document.getElementById("page-numbers");
  if (!container) return;

  container.innerHTML = "";

  const { perPage, currentPage } = state[type];
  const totalPages = Math.ceil(totalItems / perPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-button";
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      state[type].currentPage = i;
      displayItems(type);
    };
    container.appendChild(btn);
  }

  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn)
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction, type) {
  const { currentPage, perPage, data } = state[type];
  const totalPages = Math.ceil(data.length / perPage);
  let newPage = currentPage + direction;
  if (newPage < 1) newPage = 1;
  if (newPage > totalPages) newPage = totalPages;
  if (newPage !== currentPage) {
    state[type].currentPage = newPage;
    displayItems(type);
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

document.addEventListener("DOMContentLoaded", () => {
  fetchData("product", `${BACKEND_URL}/sanpham`);
  fetchData("receipt", `${BACKEND_URL}/phieunhap`);
  fetchData("export", `${BACKEND_URL}/phieuxuat`);
  fetchData("inventory", `${BACKEND_URL}/phieukiemke`);
  fetchData("order", `${BACKEND_URL}/donhang`);

  // Đăng ký sự kiện nhập liệu cho từng input tìm kiếm
  Object.keys(state).forEach((type) => {
    const searchInput = document.getElementById(state[type].searchInputId);
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state[type].currentPage = 1;
        displayItems(type);
      });
    }
  });

  // Riêng input limit tồn kho của product
  const limitInput = document.getElementById(state.product.limitInputId);
  if (limitInput) {
    limitInput.addEventListener("input", () => {
      state.product.currentPage = 1;
      displayItems("product");
    });
  }

  // Nút phân trang prev/next (giả sử bạn có 2 nút này)
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      // Lấy loại đang active (cần logic xác định)
      // Giả sử bạn có biến lưu loại đang xem, hoặc bạn gọi cho tất cả thì update từng loại riêng
      // Ở đây mình lấy mặc định "product" (bạn có thể thay đổi tùy UI)
      changePage(-1, currentActiveType());
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      changePage(1, currentActiveType());
    });
  }
});

// Giả sử bạn có cách lấy type đang hiển thị
function currentActiveType() {
  // Ví dụ bạn có tabs hoặc phần tử active đang chọn:
  // return "product" | "receipt" | "export" | "inventory" | "order"
  // Cần bạn tự bổ sung tùy giao diện.
  return "product";
}

// Hàm giả định để bạn thay thế, bạn phải có UI quản lý tab hoặc kiểu nào đang active
