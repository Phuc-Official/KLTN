let selectedOrderIds = new Set();
let orderSelectCount = {};
let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính
const today = new Date().toISOString().split("T")[0];

// Hàm quay về trang trước
function cancel() {
  window.history.back();
}

async function fetchUnitOfMeasurements() {
  try {
    const response = await fetch("http://localhost:3000/api/donvitinh");
    if (!response.ok) {
      throw new Error("Không thể tải danh sách đơn vị tính.");
    }
    unitOfMeasurements = await response.json(); // Lưu trữ đơn vị tính vào mảng
  } catch (error) {
    console.error("Lỗi khi tải đơn vị tính:", error);
  }
}

// Hàm chuyển hướng đến trang chi tiết đơn hàng
function viewOrderDetails(orderId) {
  window.location.href = `../order/orderDetail.html?id=${orderId}`;
}

// Hàm gợi ý mã đơn hàng tiếp theo
async function suggestNextOrderId() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/donhang/max-madonhang"
    );
    const data = await response.json();
    const nextOrderId = data.maxMaDonHang
      ? generateNextOrderId(data.maxMaDonHang)
      : "DH0001"; // Giá trị mặc định nếu chưa có đơn hàng nào

    document.getElementById("order-id").value = nextOrderId; // Hiển thị mã đơn hàng gợi ý
  } catch (error) {
    console.error("Lỗi khi gợi ý mã đơn hàng:", error);
  }
}

// Hàm tạo mã đơn hàng tiếp theo
function generateNextOrderId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
  return prefix + nextNumber;
}

// Hàm thêm đơn hàng
async function addOrder() {
  const order = getOrderDetailsFromForm();

  if (!order) {
    alert("Vui lòng điền đầy đủ thông tin đơn hàng.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/donhang", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Không thể thêm đơn hàng: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    const orderId = result.MaDonHang;

    // Cập nhật chi tiết đơn hàng cho từng sản phẩm
    const productPromises = selectedProducts.map(async (productInfo) => {
      const productDetails = {
        MaDonHang: orderId,
        MaSanPham: productInfo.MaSanPham,
        SoLuong: productInfo.quantity,
        MaDonViKhac: productInfo.MaDonVi, // Sử dụng đơn vị đã chọn
      };
      console.log("Thông tin chi tiết đơn hàng:", productDetails); // Log thông tin chi tiết

      // Gửi yêu cầu thêm chi tiết đơn hàng
      const detailResponse = await fetch(
        "http://localhost:3000/api/chitietdonhang",
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
          `Không thể thêm chi tiết đơn hàng: ${errorData.message}`
        );
      }
    });

    await Promise.all(productPromises);
    alert("Đơn hàng và sản phẩm đã được thêm thành công.");
    document.getElementById("order-form").reset();
    selectedProducts = [];
    updateSelectedProducts();
  } catch (error) {
    console.error("Lỗi khi thêm đơn hàng:", error);
    alert(error.message);
  }
}

// Hàm lấy thông tin đơn hàng từ form
function getOrderDetailsFromForm() {
  // Kiểm tra xem có sản phẩm nào đã được chọn không
  if (selectedProducts.length === 0) {
    console.error("Không có sản phẩm nào được chọn.");
    return null; // Trả về null nếu không có sản phẩm nào
  }

  const orderId = document.getElementById("order-id").value.trim();
  const supplierId = document.getElementById("supplier").value.trim();
  const employeeId = document.getElementById("employee").value.trim();
  const dateCreated = document.getElementById("date-create").value.trim();
  const description = document.getElementById("description").value.trim();

  // Kiểm tra tất cả các trường có giá trị hợp lệ
  if (!orderId || !supplierId || !employeeId || !dateCreated) {
    console.error("Thiếu thông tin cần thiết.");
    return null; // Trả về null nếu thiếu thông tin
  }

  return {
    MaDonHang: orderId,
    MaNhaCungCap: supplierId,
    MaNhanVien: employeeId,
    NgayNhap: dateCreated,
    MoTa: description,
    TongGiaTri: calculateTotalValue(), // Tính tổng giá trị
  };
}

// Hàm tính tổng giá trị đơn hàng
function calculateTotalValue() {
  return selectedProducts.reduce((total, productInfo) => total, 0);
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

// Hàm lấy danh sách đơn hàng và hiển thị
async function fetchOrders() {
  try {
    const response = await fetch("http://localhost:3000/api/donhang");
    const orders = await response.json();

    // Lấy chi tiết đơn hàng cho từng đơn
    const detailPromises = orders.map(async (order) => {
      const detailsResponse = await fetch(
        `http://localhost:3000/api/chitietdonhang/${order.MaDonHang}`
      );
      const details = await detailsResponse.json();
      return { ...order, details };
    });

    const fullOrders = await Promise.all(detailPromises);
    displayOrders(fullOrders);
  } catch (error) {
    console.error("Lỗi khi tải đơn hàng:", error);
  }
}

// Hàm hiển thị đơn hàng
function displayOrders(orders) {
  const container = document.querySelector("#order-container tbody");
  container.innerHTML = "";

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.MaDonHang}</td>
      <td>${order.TenNhaCungCap}</td>
      <td>${order.TenNhanVien}</td>
      <td>${order.NgayNhap}</td>
    `;
    row.addEventListener("click", () => viewOrderDetails(order.MaDonHang));
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
      !selectedOrderIds.has(product.MaSanPham) // Ẩn sản phẩm đã chọn
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
let selectedProducts = []; // Mảng để lưu trữ thông tin sản phẩm đã chọn

async function selectProduct(product) {
  const productInfo = {
    uniqueId: `${product.MaSanPham}-${selectedProducts.length + 1}`,
    MaSanPham: product.MaSanPham,
    TenSanPham: product.TenSanPham,
    quantity: 1,
    selectedUnitName: "",
    MaDonVi: null,
  };

  // Lấy danh sách đơn vị từ bảng DonViKhac (giống phiếu nhập)
  productInfo.units = await fetchUnitsByProduct(product.MaSanPham);

  selectedProducts.push(productInfo);
  updateSelectedProducts();
  filterProducts();
  document.getElementById("product-list").style.display = "none";
}

async function fetchUnitsByProduct(maSanPham) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvitinhkhac/${maSanPham}`
    );
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách đơn vị tính.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy đơn vị:", error);
    return [];
  }
}

// Cập nhật thông tin sản phẩm đã chọn
function updateSelectedProducts() {
  const selectedProductsDiv = document.getElementById("selected-products");
  selectedProductsDiv.innerHTML = "";

  const productTable = document.createElement("table");
  productTable.innerHTML = `
      <thead>
          <tr>
              <th>STT</th>
              <th>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>
              <th>Đơn vị</th>
              <th>Số lượng</th>
              <th>Hành động</th>
          </tr>
      </thead>
      <tbody>
  `;

  selectedProducts.forEach((productInfo, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${index + 1}</td>
          <td>${productInfo.MaSanPham}</td>
          <td>${productInfo.TenSanPham}</td>
          <td>
            <select id="${productInfo.uniqueId}-unit" onchange="updateUnit('${
      productInfo.uniqueId
    }', this.value)">
              <option value="" disabled ${
                !productInfo.MaDonVi ? "selected" : ""
              }>Chọn đơn vị</option>
              ${productInfo.units
                .map(
                  (unit) => `
                  <option 
                    value="${unit.ID}" 
                    ${productInfo.MaDonVi == unit.ID ? "selected" : ""}
                  >
                    ${unit.TenDonVi}
                  </option>
                `
                )
                .join("")}
            </select>
          </td>
          <td>
            <input type="number" id="${productInfo.uniqueId}-quantity" value="${
      productInfo.quantity
    }" min="1" onchange="setQuantity('${productInfo.uniqueId}', this.value)" />
          </td>
          <td><button onclick="removeProduct('${
            productInfo.uniqueId
          }')">Xóa</button></td>
      `;
    productTable.querySelector("tbody").appendChild(row);
  });

  productTable.innerHTML += `</tbody>`;
  selectedProductsDiv.appendChild(productTable);
}

// Hàm thiết lập số lượng từ ô nhập
function updateUnit(uniqueId, unitId) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    productInfo.MaDonVi = unitId; // Cập nhật mã đơn vị
    updateSelectedProducts(); // Cập nhật bảng
  }
}

function setQuantity(uniqueId, value) {
  if (isUpdatingTotal) return; // Ngăn không cho gọi lại

  isUpdatingTotal = true; // Đặt cờ

  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    const quantity = Math.max(1, parseInt(value, 10));
    productInfo.quantity = quantity;

    // Cập nhật lại thành tiền
    // const totalPrice = productInfo.price * quantity;
    // document.getElementById(`${uniqueId}-total`).textContent =
    //   totalPrice.toLocaleString() + " đ";

    // // Cập nhật tổng giá trị vào phiếu nhập
    // const totalValue = calculateTotalValue();
    // document.getElementById(
    //   "total-price"
    // ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;

    updateSelectedProducts(); // Gọi hàm cập nhật
  }

  isUpdatingTotal = false; // Đặt cờ về trạng thái ban đầu
}

let isUpdatingTotal = false;

function updatePrice(uniqueId, value) {
  if (isUpdatingTotal) return; // Ngăn không cho gọi lại

  isUpdatingTotal = true; // Đặt cờ

  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    const price = Math.max(0, parseFloat(value));
    productInfo.price = price;

    // Cập nhật lại thành tiền
    const totalPrice = price * productInfo.quantity;
    document.getElementById(`${uniqueId}-total`).textContent =
      totalPrice.toLocaleString() + " đ";

    // Cập nhật tổng giá trị vào phiếu nhập
    const totalValue = calculateTotalValue();
    document.getElementById(
      "total-price"
    ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;

    updateSelectedProducts(); // Gọi hàm cập nhật
  }

  isUpdatingTotal = false; // Đặt cờ về trạng thái ban đầu
}

// Hàm xóa sản phẩm
function removeProduct(uniqueId) {
  // Tìm và xóa sản phẩm khỏi danh sách đã chọn
  selectedProducts = selectedProducts.filter((p) => p.uniqueId !== uniqueId);

  // Cập nhật lại giao diện hiển thị sản phẩm đã chọn
  updateSelectedProducts();
}

// Khởi tạo các hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  loadSuppliers();
  fetchUnitOfMeasurements();
  suggestNextOrderId(); // Gợi ý mã đơn hàng khi trang tải
  loadProducts(); // Tải sản phẩm
  loadEmployees();

  // Gọi hàm lọc sản phẩm khi người dùng nhập vào ô tìm kiếm
  document
    .getElementById("search-product")
    .addEventListener("input", filterProducts);

  // Gọi hàm khi thêm đơn hàng
  document.getElementById("add-button").addEventListener("click", addOrder);
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

document.getElementById("date-create").value = today;
