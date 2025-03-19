// const headerSanPham = [
//   "Tên sản phẩm",
//   "Trọng lượng",
//   "Đơn vị tính",
//   "Số lượng tồn",
// ];

function cancel() {
  // Quay về trang trước
  window.history.back();
}
function viewProductDetails(productId) {
  window.location.href = `../product/productDetails.html?id=${productId}`; // Chuyển hướng đến trang chi tiết
}

async function addProduct() {
  const product = {
    MaSanPham: document.getElementById("product-id").value,
    TenSanPham: document.getElementById("product-name").value,
    TrongLuong: document.getElementById("weight").value,
    DonViTinh: document.getElementById("unit").value,
    SoLuongTonQuyDoi: document.getElementById("converted-stock-quantity").value,
    SoLuongTon: document.getElementById("quantity").value,
    MoTaSanPham: document.getElementById("description").value,
    MaDonVi: document.getElementById("unit").value,
  };

  try {
    const response = await fetch("http://localhost:3000/api/sanpham", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm sản phẩm");
    }

    const result = await response.json();
    alert(result.message); // Thông báo thêm sản phẩm thành công

    // Reset form
    document.getElementById("product-form").reset();
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    alert("Lỗi khi thêm sản phẩm!");
  }
}

// async function getProducts(endpoint, containerId) {
//   try {
//     const response = await fetch(`http://localhost:3000/api/${endpoint}`);
//     if (!response.ok) {
//       throw new Error("Mạng lỗi, không thể lấy dữ liệu");
//     }
//     const data = await response.json();
//     const container = document.getElementById(containerId);

//     // Tạo tiêu đề cho bảng
//     const headerRow = document.createElement("tr");
//     headerSanPham.forEach((key) => {
//       const th = document.createElement("th");
//       th.textContent = key;
//       headerRow.appendChild(th);
//     });
//     container.appendChild(headerRow);

//     // Hiển thị dữ liệu
//     const formatted = data.map((item) => ({
//       tenSP: item.TenSanPham,
//       trongLuong: item.TrongLuong,
//       dvTinh: item.DonViTinh,
//       soLuongTon: item.SoLuongTon,
//     }));

//     formatted.forEach((item) => {
//       const row = document.createElement("tr");
//       Object.values(item).forEach((value) => {
//         const td = document.createElement("td");
//         td.textContent = value; // Hiển thị giá trị
//         row.appendChild(td);
//       });
//       container.appendChild(row);
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy dữ liệu:", error);
//   }
// }

async function fetchProducts() {
  try {
    const response = await fetch("http://localhost:3000/api/sanpham");
    const products = await response.json();

    const container = document.querySelector("#sanpham-container tbody");
    container.innerHTML = ""; // Xóa nội dung cũ

    products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${product.MaSanPham}</td>
          <td>${product.TenSanPham}</td>
          <td>${
            product.TenNhom || "Không xác định"
          }</td> <!-- Hiển thị TenNhom -->
          <td>${product.SoLuongTon}</td>
      `;
      row.addEventListener("click", () => {
        viewProductDetails(product.MaSanPham);
      });
      container.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
  }
}

fetchProducts(); // Gọi hàm khi trang được tải

// Gọi hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  // getProducts("donhang", "donhang-container");
  // getProducts("sanpham", "sanpham-container");
});

// Hàm thêm sản phẩm
document
  .getElementById("add-product-button")
  .addEventListener("click", addProduct);
