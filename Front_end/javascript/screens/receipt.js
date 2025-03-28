let selectedProductIds = new Set();
const today = new Date().toISOString().split("T")[0];

// Hàm quay về trang trước
function cancel() {
  window.history.back();
}

// Hàm chuyển hướng đến trang chi tiết phiếu nhập
function viewReceiptDetails(receiptId) {
  window.location.href = `../receipt/receiptDetail.html?id=${receiptId}`;
}

// Hàm gợi ý mã phiếu nhập tiếp theo
async function suggestNextReceiptId() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/phieunhap/max-maphieunhap"
    );
    const data = await response.json();
    const nextReceiptId = data.maxMaPhieuNhap
      ? generateNextReceiptId(data.maxMaPhieuNhap)
      : "PN0001"; // Giá trị mặc định nếu chưa có phiếu nhập nào

    document.getElementById("receipt-id").value = nextReceiptId; // Hiển thị mã phiếu nhập gợi ý
  } catch (error) {
    console.error("Lỗi khi gợi ý mã phiếu nhập:", error);
  }
}

// Hàm tạo mã phiếu nhập tiếp theo
function generateNextReceiptId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
  return prefix + nextNumber;
}

// Hàm thêm phiếu nhập
async function addReceipt() {
  const receipt = getReceiptDetailsFromForm();

  console.log("Dữ liệu phiếu nhập:", receipt); // Log dữ liệu phiếu nhập

  try {
    // Thêm phiếu nhập
    const response = await fetch("http://localhost:3000/api/phieunhap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(receipt),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Lỗi khi thêm phiếu nhập:", errorData);
      throw new Error(
        `Không thể thêm phiếu nhập: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    const receiptId = result.MaPhieuNhap;
    if (!receiptId) {
      throw new Error("Mã phiếu nhập không được trả về.");
    }

    // Cập nhật số lượng tồn kho cho từng sản phẩm đã chọn
    const productPromises = Array.from(selectedProductIds)
      .map((MaSanPham) => {
        const product = window.productsList.find(
          (p) => p.MaSanPham === MaSanPham
        );
        if (product) {
          const quantity =
            parseInt(
              document.getElementById(`${product.MaSanPham}-quantity`).value,
              10
            ) || 1;

          // Tạo chi tiết phiếu nhập
          const productDetails = {
            MaPhieuNhap: receiptId,
            MaSanPham: product.MaSanPham,
            SoLuong: quantity, // Số lượng cho chi tiết phiếu nhập
            GiaSanPham: product.GiaSanPham || 0,
          };

          console.log("Dữ liệu chi tiết phiếu nhập:", productDetails);

          // Gửi yêu cầu thêm chi tiết phiếu nhập
          return fetch("http://localhost:3000/api/chitietphieunhap", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productDetails),
          }).then(() => {
            // Cập nhật số lượng tồn kho trong danh sách sản phẩm
            updateProductStock(product.MaSanPham, quantity); // Cộng số lượng tồn kho
          });
        }
      })
      .filter(Boolean);

    await Promise.all(productPromises);
    console.log("Tất cả chi tiết phiếu nhập đã được thêm thành công.");

    alert("Phiếu nhập và sản phẩm đã được thêm thành công.");
    document.getElementById("receipt-form").reset();
    selectedProductIds.clear();
    updateSelectedProducts();
  } catch (error) {
    console.error("Lỗi khi thêm phiếu nhập:", error);
    alert(error.message);
  }
}

// Hàm cập nhật số lượng tồn kho
function updateProductStock(productId, change) {
  const product = window.productsList.find((p) => p.MaSanPham === productId);
  if (product) {
    // Nếu SoLuongTon là null, gán giá trị mặc định là 0
    product.SoLuongTon = (product.SoLuongTon || 0) + change; // Cộng số lượng tồn
    console.log(
      `Số lượng tồn kho của sản phẩm ${productId} đã được cập nhật: ${product.SoLuongTon}`
    );
  }
}

// Hàm lấy thông tin phiếu nhập từ form
function getReceiptDetailsFromForm() {
  const selectedProducts = Array.from(selectedProductIds);

  if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
    console.error("Không có sản phẩm nào được chọn.");
  }

  console.log(selectedProducts);
  return {
    MaPhieuNhap: document.getElementById("receipt-id").value || "",
    MaNhaCungCap: document.getElementById("supplier").value || "",
    MaNhanVien: document.getElementById("employee").value || "",
    NgayNhap: document.getElementById("date-create").value || "",
    MoTa: document.getElementById("description").value || "",
    TongGiaTri: calculateTotalValue(),
    // MaSanPham: selectedProducts,
  };
}

// Hàm tính tổng giá trị phiếu nhập
function calculateTotalValue() {
  const products = getProductsFromForm();
  return products.reduce(
    (total, product) => total + product.GiaSanPham * product.SoLuong,
    0
  );
}

// Hàm lấy danh sách sản phẩm từ form
function getProductsFromForm() {
  const productRows = document.querySelectorAll("#products tbody tr");
  return Array.from(productRows).map((row) => ({
    GiaSanPham: parseFloat(
      row.querySelector(".product-price").value.replace(/\./g, "")
    ),
    SoLuong: parseInt(row.querySelector(".product-quantity").value, 10),
  }));
}

// Hàm lấy danh sách phiếu nhập và hiển thị
async function fetchReceipts() {
  try {
    const response = await fetch("http://localhost:3000/api/phieunhap");
    const receipts = await response.json();

    // Lấy chi tiết phiếu nhập cho từng phiếu
    const detailPromises = receipts.map(async (receipt) => {
      const detailsResponse = await fetch(
        `http://localhost:3000/api/chitietphieunhap/${receipt.MaPhieuNhap}`
      );
      const details = await detailsResponse.json();
      return { ...receipt, details };
    });

    const fullReceipts = await Promise.all(detailPromises);
    displayReceipts(fullReceipts);
  } catch (error) {
    console.error("Lỗi khi tải phiếu nhập:", error);
  }
}

// Hàm hiển thị phiếu nhập
function displayReceipts(receipts) {
  const container = document.querySelector("#receipt-container tbody");
  container.innerHTML = "";

  receipts.forEach((receipt) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receipt.MaPhieuNhap}</td>
      <td>${receipt.TenNhaCungCap}</td>
      <td>${receipt.TenNhanVien}</td>
      <td>${receipt.NgayNhap}</td>
    `;
    row.addEventListener("click", () =>
      viewReceiptDetails(receipt.MaPhieuNhap)
    );
    container.appendChild(row);
  });
}

// Hàm tải nhà cung cấp
async function loadSuppliers() {
  try {
    const response = await fetch("http://localhost:3000/api/nhacungcap");
    const suppliers = await response.json();
    populateSupplierSelect(suppliers);
  } catch (error) {
    console.error("Lỗi khi tải nhà cung cấp:", error);
  }
}

// Hàm điền nhà cung cấp vào select
function populateSupplierSelect(suppliers) {
  const supplierSelect = document.getElementById("supplier");
  suppliers.forEach((supplier) => {
    const option = document.createElement("option");
    option.value = supplier.MaNhaCungCap;
    option.textContent = supplier.TenNhaCungCap;
    supplierSelect.appendChild(option);
  });
}

// Hàm tải nhân viên
async function loadEmployees() {
  try {
    const response = await fetch("http://localhost:3000/api/nhanvien");

    // Kiểm tra nếu phản hồi không thành công
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const employees = await response.json();
    populateEmployeeSelect(employees);
  } catch (error) {
    console.error("Lỗi khi tải nhân viên:", error);
  }
}

// Hàm điền nhân viên vào select
function populateEmployeeSelect(employees) {
  const employeeSelect = document.getElementById("employee");
  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.MaNhanVien; // Thay đổi theo thuộc tính của nhân viên
    option.textContent = employee.TenNhanVien; // Thay đổi theo thuộc tính của nhân viên
    employeeSelect.appendChild(option);
  });
}

// Hàm tải sản phẩm
async function loadProducts() {
  try {
    const response = await fetch("http://localhost:3000/api/sanpham");
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách sản phẩm");
    }
    const products = await response.json();
    window.productsList = products;
    displayProducts(products);
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
  }
}

// Hàm hiển thị danh sách sản phẩm
function displayProducts(products) {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  products.forEach((product) => {
    const li = document.createElement("li");
    li.textContent = `${product.TenSanPham} (${product.MaSanPham})`;
    li.dataset.value = product.MaSanPham;
    li.onclick = () => selectProduct(product);
    productList.appendChild(li);
  });
}

// Hàm lọc sản phẩm
function filterProducts() {
  if (!window.productsList) {
    console.error("Danh sách sản phẩm chưa được tải.");
    return;
  }

  const searchValue = document
    .getElementById("search-product")
    .value.toLowerCase();

  const filteredProducts = window.productsList.filter(
    (product) =>
      (product.TenSanPham.toLowerCase().includes(searchValue) ||
        product.MaSanPham.toLowerCase().includes(searchValue)) &&
      !selectedProductIds.has(product.MaSanPham) // Ẩn sản phẩm đã chọn
  );

  displayFilteredProducts(filteredProducts);
}

// Hàm hiển thị sản phẩm đã lọc
function displayFilteredProducts(filteredProducts) {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  filteredProducts.forEach((product) => {
    const li = document.createElement("li");
    li.textContent = `${product.TenSanPham} (${product.MaSanPham})`;
    li.dataset.value = product.MaSanPham;
    li.onclick = () => selectProduct(product);
    productList.appendChild(li);
  });

  productList.style.display = filteredProducts.length > 0 ? "block" : "none";
}

// Hàm chọn sản phẩm
function selectProduct(product) {
  const productId = product.MaSanPham;

  // Nếu sản phẩm đã được chọn, bỏ chọn
  if (selectedProductIds.has(productId)) {
    selectedProductIds.delete(productId);
  } else {
    selectedProductIds.add(productId);
  }

  updateSelectedProducts();
  filterProducts(); // Cập nhật lại danh sách sản phẩm
  document.getElementById("product-list").style.display = "none"; // Ẩn danh sách sản phẩm
}

let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính

async function fetchUnitOfMeasurements() {
  try {
    const response = await fetch("http://localhost:3000/api/donvitinh");
    unitOfMeasurements = await response.json(); // Lưu trữ đơn vị tính vào mảng
  } catch (error) {
    console.error("Lỗi khi tải đơn vị tính:", error);
  }
}

// Cập nhật thông tin sản phẩm đã chọn
function updateSelectedProducts() {
  const selectedProductsDiv = document.getElementById("selected-products");
  selectedProductsDiv.innerHTML = ""; // Xóa nội dung cũ

  let index = 1; // Khởi tạo chỉ số STT
  const productTable = document.createElement("table");
  productTable.innerHTML = `
      <thead>
          <tr>
              <th>STT</th>
              <th>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>
              <th>Tên đơn vị</th>
              <th>Số lượng</th>
              <th>Giá sản phẩm</th>
              <th>Thành tiền</th>
              <th>Hành động</th>
          </tr>
      </thead>
      <tbody>
  `;

  let totalValue = 0; // Biến lưu tổng giá trị

  selectedProductIds.forEach((productId) => {
    const product = window.productsList.find((p) => p.MaSanPham === productId);
    if (product) {
      const quantity = product.quantity || 1; // Số lượng
      const price = product.GiaSanPham || 0; // Giá sản phẩm
      const totalPrice = price * quantity; // Tính thành tiền

      totalValue += totalPrice; // Cộng dồn vào tổng giá trị

      // Tìm tên đơn vị tính tương ứng
      const unit = unitOfMeasurements.find(
        (u) => u.MaDonVi === product.MaDonVi
      );
      const unitName = unit ? unit.TenDonVi : "Không tìm thấy"; // Lấy tên đơn vị hoặc thông báo không tìm thấy

      const row = document.createElement("tr");
      row.innerHTML = `
              <td>${index++}</td>
              <td>${product.MaSanPham}</td>
              <td>${product.TenSanPham}</td>
              <td>${unitName}</td>
              <td>
                  <input type="number" id="${
                    product.MaSanPham
                  }-quantity" value="${quantity}" min="1" onchange="setQuantity('${
        product.MaSanPham
      }', this.value)" />
              </td>
              <td>${price.toLocaleString()} đ</td>
              <td id="${
                product.MaSanPham
              }-total">${totalPrice.toLocaleString()} đ</td>
              <td><button onclick="removeProduct('${
                product.MaSanPham
              }')">Xóa</button></td>
          `;
      productTable.querySelector("tbody").appendChild(row);
    }
  });

  productTable.innerHTML += `</tbody>`;
  selectedProductsDiv.appendChild(productTable);

  // Cập nhật tổng giá trị vào phiếu nhập
  document.getElementById(
    "total-price"
  ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;
}

// Hàm cập nhật số lượng sản phẩm
function updateQuantity(productId, change) {
  const product = window.productsList.find((p) => p.MaSanPham === productId);
  if (product) {
    product.quantity = (product.quantity || 1) + change;

    // Đảm bảo số lượng không âm
    if (product.quantity < 1) {
      product.quantity = 1;
    }

    // Cập nhật lại bảng
    updateSelectedProducts();
  }
}

// Hàm thiết lập số lượng từ ô nhập
function setQuantity(productId, value) {
  const product = window.productsList.find((p) => p.MaSanPham === productId);
  if (product) {
    const quantity = Math.max(1, parseInt(value, 10)); // Đảm bảo số lượng không âm
    product.quantity = quantity;

    // Cập nhật lại thành tiền
    const totalPrice = product.GiaSanPham * quantity;
    document.getElementById(`${productId}-total`).textContent =
      totalPrice.toLocaleString() + " đ";

    // Cập nhật lại tổng giá trị
    updateSelectedProducts();
  }
}

// Hàm xóa sản phẩm
function removeProduct(productId) {
  selectedProductIds.delete(productId);
  updateSelectedProducts();
  filterProducts(); // Cập nhật danh sách sản phẩm
}

// Khởi tạo các hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  fetchReceipts();
  loadSuppliers();
  fetchUnitOfMeasurements();
  suggestNextReceiptId(); // Gợi ý mã phiếu nhập khi trang tải
  loadProducts(); // Tải sản phẩm
  loadEmployees();

  // Gọi hàm lọc sản phẩm khi người dùng nhập vào ô tìm kiếm
  document
    .getElementById("search-product")
    .addEventListener("input", filterProducts);

  // Gọi hàm khi thêm phiếu nhập
  document.getElementById("add-button").addEventListener("click", addReceipt);
});

// Ẩn danh sách sản phẩm khi nhấn ra ngoài ô tìm kiếm
document.addEventListener("click", (event) => {
  const productList = document.getElementById("product-list");
  const searchInput = document.getElementById("search-product");

  if (
    !searchInput.contains(event.target) &&
    !productList.contains(event.target)
  ) {
    productList.style.display = "none"; // Ẩn danh sách sản phẩm
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

document.getElementById("date-create").value = today;
