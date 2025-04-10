function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const regex = /([^&=]+)=([^&]*)/g;
  let match;

  while ((match = regex.exec(queryString))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }
  return params;
}

// Khi trang được tải, thực hiện lấy thông tin
document.addEventListener("DOMContentLoaded", async () => {
  const params = getQueryParams();

  // Log thông tin thu được
  console.log("Thông tin thu được từ URL:", params);

  const urlParams = new URLSearchParams(window.location.search);
  const productsJson = urlParams.get("products");
  console.log("Dữ liệu sản phẩm từ URL:", productsJson);

  // Hiển thị thông tin phiếu nhập
  document.getElementById("receipt-id").value = params.orderId || "";
  document.getElementById("supplier").value = params.supplier || "";
  document.getElementById("employee").value = params.employee || "";
  document.getElementById("total-price").value = params.totalPrice || "";
  document.getElementById("description").value = params.description || "";

  // Kiểm tra và hiển thị sản phẩm đã chọn
  if (params.products) {
    const products = JSON.parse(decodeURIComponent(params.products));
    displaySelectedProducts(products);
  }
});

// Hàm hiển thị sản phẩm đã chọn
function displaySelectedProducts(products) {
  const productListDiv = document.getElementById("selected-products");
  productListDiv.innerHTML = ""; // Xóa nội dung cũ

  const productTable = document.createElement("table");
  productTable.innerHTML = `
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã SP</th>
          <th>Tên SP</th>
          <th>Đơn vị</th>
          <th>Số lượng</th>
          <th>Giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
    `;

  products.forEach((product, index) => {
    const totalPrice = (product.Gia * product.SoLuong).toLocaleString();
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${product.MaSanPham}</td>
        <td>${product.TenSanPham}</td>
        <td>${product.MaDonVi || ""}</td>
        <td>${product.SoLuong}</td>
        <td>${product.Gia.toLocaleString()} đ</td>
        <td>${totalPrice} đ</td>
      `;
    productTable.querySelector("tbody").appendChild(row);
  });

  productTable.innerHTML += `</tbody>`;
  productListDiv.appendChild(productTable);
}

function cancel() {
  // Quay về trang trước
  window.history.back();
}

document
  .getElementById("save-receipt-button")
  .addEventListener("click", async () => {
    const receiptId = document.getElementById("receipt-id").value.trim();

    // Kiểm tra mã phiếu nhập
    if (!receiptId) {
      alert("Mã phiếu nhập không được để trống!");
      return;
    }

    const supplierId = document.getElementById("supplier").value.trim();
    const employeeId = document.getElementById("employee").value.trim();
    const totalPrice = document.getElementById("total-price").value.trim();
    const description = document.getElementById("description").value.trim();

    // Lấy danh sách sản phẩm từ table
    const products = Array.from(
      document.querySelectorAll("#selected-products tbody tr")
    ).map((row) => ({
      MaSanPham: row.cells[1].textContent.trim(),
      TenSanPham: row.cells[2].textContent.trim(),
      MaDonVi: row.cells[3].textContent.trim(), // Sử dụng MaDonVi thay vì TenDonVi
      SoLuong: row.cells[4].textContent.trim(),
      Gia: row.cells[5].textContent
        .trim()
        .replace(/ đ/g, "")
        .replace(/\./g, ""),
    }));

    // Tạo đối tượng phiếu nhập
    const receiptData = {
      MaPhieuNhap: receiptId,
      MaNhaCungCap: supplierId,
      MaNhanVien: employeeId,
      NgayNhap: new Date().toISOString(),
      MoTa: description,
      TongGiaTri: totalPrice,
      products,
    };

    console.log("Dữ liệu sẽ được gửi:", JSON.stringify(receiptData, null, 2));

    try {
      // Lưu phiếu nhập
      const response = await fetch("http://localhost:3000/api/phieunhap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        throw new Error("Không thể lưu phiếu nhập");
      }

      const result = await response.json();
      const newReceiptId = result.MaPhieuNhap; // Lấy ID phiếu nhập mới

      // Lưu chi tiết phiếu nhập cho từng sản phẩm
      const productPromises = products.map(async (productInfo) => {
        const productDetails = {
          MaPhieuNhap: newReceiptId, // ID phiếu nhập mới
          MaSanPham: productInfo.MaSanPham,
          SoLuong: parseInt(productInfo.SoLuong, 10), // Chuyển đổi thành số
          GiaSanPham: parseFloat(productInfo.Gia), // Chuyển đổi thành số
          MaDonVi: productInfo.MaDonVi, // Sử dụng MaDonVi
        };

        console.log("Thêm chi tiết phiếu nhập cho sản phẩm:", productDetails);

        // Gửi yêu cầu thêm chi tiết phiếu nhập
        const detailResponse = await fetch(
          "http://localhost:3000/api/chitietphieunhap",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productDetails),
          }
        );

        if (!detailResponse.ok) {
          const errorData = await detailResponse.json();
          throw new Error(
            `Không thể thêm chi tiết phiếu nhập: ${errorData.message}`
          );
        }
      });

      await Promise.all(productPromises); // Chờ tất cả chi tiết sản phẩm được thêm

      alert("Phiếu nhập và sản phẩm đã được thêm thành công!");
      document.getElementById("receipt-form").reset();
      selectedProducts = [];
      // updateSelectedProducts(); // Cập nhật giao diện người dùng
    } catch (error) {
      console.error("Lỗi khi lưu phiếu nhập:", error);
      alert(error.message);
    }
  });
