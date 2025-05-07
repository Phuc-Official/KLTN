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

async function loadSuppliers() {
  try {
    const response = await fetch("http://localhost:3000/api/nhacungcap");
    if (!response.ok) {
      throw new Error("Không thể tải danh sách nhà cung cấp");
    }
    const suppliers = await response.json();
    return suppliers;
  } catch (error) {
    console.error("Lỗi khi tải nhà cung cấp:", error);
    return [];
  }
}

async function loadEmployees() {
  try {
    const response = await fetch("http://localhost:3000/api/nhanvien");
    if (!response.ok) {
      throw new Error("Không thể tải danh sách nhân viên");
    }
    const employees = await response.json();
    return employees;
  } catch (error) {
    console.error("Lỗi khi tải nhân viên:", error);
    return [];
  }
}

// Biến toàn cục để lưu thông tin sản phẩm từ URL
let productsFromUrl = [];

document.addEventListener("DOMContentLoaded", async () => {
  const params = getQueryParams();
  console.log("Thông tin thu được từ URL:", params);

  const urlParams = new URLSearchParams(window.location.search);
  const productsJson = urlParams.get("products");
  console.log("Dữ liệu sản phẩm từ URL:", productsJson);

  // Tải danh sách nhà cung cấp và nhân viên
  const [suppliers, employees] = await Promise.all([
    loadSuppliers(),
    loadEmployees(),
  ]);

  // Hiển thị thông tin phiếu nhập
  document.getElementById("receipt-id").value = params.orderId || "";

  // Hiển thị tên nhà cung cấp
  const supplier = suppliers.find((s) => s.MaNhaCungCap === params.supplier);
  document.getElementById("supplier").value = supplier
    ? supplier.TenNhaCungCap
    : "Không tìm thấy";

  // Hiển thị tên nhân viên
  const employee = employees.find((e) => e.MaNhanVien === params.employee);
  document.getElementById("employee").value = employee
    ? employee.TenNhanVien
    : "Không tìm thấy";

  document.getElementById("description").value = params.description || "";

  // Kiểm tra và hiển thị sản phẩm đã chọn
  if (productsJson) {
    productsFromUrl = JSON.parse(decodeURIComponent(productsJson));
    displaySelectedProducts(productsFromUrl);
  }
});

function displaySelectedProducts(products) {
  const productListDiv = document.getElementById("selected-products");
  productListDiv.innerHTML = "";

  const productTable = document.createElement("table");
  productTable.innerHTML = `
    <thead>
      <tr>
        <th>STT</th>
        <th>Mã SP</th>
        <th>Tên SP</th>
        <th>Đơn vị</th>
        <th>Số lượng</th>
      </tr>
    </thead>
    <tbody>
  `;

  products.forEach((product, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${product.MaSanPham}</td>
      <td>${product.TenSanPham}</td>
      <td>${product.TenDonVi || product.MaDonViKhac || "Không xác định"}</td>
      <td>
        <input type="number" 
               value="${product.SoLuong}" 
               min="1" 
               class="quantity-input"
               data-product-id="${product.MaSanPham}">
      </td>
    `;
    productTable.querySelector("tbody").appendChild(row);
  });

  productListDiv.appendChild(productTable);
}

function updateProductQuantity(input, maSanPham) {
  const newQuantity = input.value;
  // Cập nhật số lượng trong productsFromUrl
  const product = productsFromUrl.find((p) => p.MaSanPham === maSanPham);
  if (product) {
    product.SoLuong = newQuantity;
  }
  console.log(
    `Số lượng cho sản phẩm ${maSanPham} đã thay đổi thành: ${newQuantity}`
  );
}

function cancel() {
  window.history.back();
}

document
  .getElementById("save-receipt-button")
  .addEventListener("click", async () => {
    // 1. Lấy mã phiếu nhập từ ô input
    const receiptId = document.getElementById("receipt-id").value.trim();
    const params = getQueryParams();

    const supplierId = params.supplier;
    const employeeId = params.employee;
    const description = document.getElementById("description").value.trim();

    // Kiểm tra thông tin bắt buộc
    if (!receiptId || !supplierId || !employeeId) {
      alert("Vui lòng điền đầy đủ thông tin phiếu nhập!");
      return;
    }

    // 2. Lấy số lượng từ các ô input trong bảng
    const productRows = document.querySelectorAll(
      "#selected-products tbody tr"
    );
    const products = Array.from(productRows).map((row, index) => {
      const maSanPham = row.cells[1].textContent.trim();
      const soLuongInput = row.cells[4].querySelector("input");
      const soLuong = parseInt(soLuongInput.value.trim(), 10);

      // 3. Tìm sản phẩm trong productsFromUrl để lấy MaDonViKhac
      const originalProduct = productsFromUrl.find(
        (p) => p.MaSanPham === maSanPham
      );

      return {
        MaSanPham: maSanPham,
        TenSanPham: row.cells[2].textContent.trim(),
        SoLuong: soLuong,
        MaDonViKhac: originalProduct ? originalProduct.MaDonViKhac : null,
      };
    });

    // Tạo đối tượng phiếu nhập
    const receiptData = {
      MaPhieuNhap: receiptId,
      MaNhaCungCap: supplierId,
      MaNhanVien: employeeId,
      NgayNhap: new Date().toISOString(),
      MoTa: description,
      products,
    };

    console.log("Dữ liệu phiếu nhập sẽ được gửi:", receiptData);

    try {
      // Kiểm tra trùng mã phiếu nhập
      const checkResponse = await fetch(
        `http://localhost:3000/api/phieunhap/${receiptId}`
      );
      if (checkResponse.ok) {
        throw new Error("Mã phiếu nhập đã tồn tại!");
      }

      // Lưu phiếu nhập chính
      const response = await fetch("http://localhost:3000/api/phieunhap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Lỗi khi lưu phiếu nhập: ${errorData.message}`);
      }

      // Lưu chi tiết phiếu nhập
      await Promise.all(
        products.map(async (product) => {
          const detailResponse = await fetch(
            "http://localhost:3000/api/chitietphieunhap",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                MaPhieuNhap: receiptId,
                MaSanPham: product.MaSanPham,
                SoLuong: product.SoLuong,
                MaDonViKhac: product.MaDonViKhac,
              }),
            }
          );

          if (!detailResponse.ok) {
            throw new Error("Lỗi khi lưu chi tiết phiếu nhập");
          }
        })
      );

      alert("Lưu phiếu nhập thành công!");
      window.location.href = "receiptList.html";
    } catch (error) {
      console.error("Lỗi:", error);
      alert(error.message);
    }
  });
