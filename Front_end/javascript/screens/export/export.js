let selectedProductIds = new Set();
let productSelectCount = {};
let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính
const today = new Date().toISOString().split("T")[0];
let selectedProducts = []; // Mảng để lưu trữ thông tin sản phẩm đã chọn

// Hàm quay về trang trước
function cancel() {
  window.history.back();
}

function create() {
  // Chuyển hướng đến trang tạo phiếu xuất
  window.location.href = "createExport.html"; // Thay đổi thành URL của trang bạn muốn chuyển đến
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

// Hàm chuyển hướng đến trang chi tiết phiếu xuất
function viewExportDetails(exportId) {
  window.location.href = `../export/exportDetail.html?id=${exportId}`;
}

// Hàm gợi ý mã phiếu xuất tiếp theo
async function suggestNextExportId() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/phieuxuat/max-maphieuxuat"
    );
    const data = await response.json();
    const nextExportId = data.maxMaPhieuXuat
      ? generateNextExportId(data.maxMaPhieuXuat)
      : "PX0001"; // Giá trị mặc định nếu chưa có phiếu xuất nào

    document.getElementById("export-id").value = nextExportId; // Hiển thị mã phiếu xuất gợi ý
  } catch (error) {
    console.error("Lỗi khi gợi ý mã phiếu xuất:", error);
  }
}

// Hàm tạo mã phiếu xuất tiếp theo
function generateNextExportId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
  return prefix + nextNumber;
}

// Hàm thêm phiếu xuất
async function addExport() {
  const exportDetails = getExportDetailsFromForm();

  if (!exportDetails) {
    alert("Vui lòng điền đầy đủ thông tin phiếu xuất.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/phieuxuat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exportDetails),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Không thể thêm phiếu xuất: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    const exportId = result.MaPhieuXuat;

    // Cập nhật chi tiết phiếu xuất cho từng sản phẩm
    const productPromises = selectedProducts.map(async (productInfo) => {
      const productDetails = {
        MaPhieuXuat: exportId,
        MaSanPham: productInfo.MaSanPham,
        SoLuong: productInfo.quantity,
        // GiaSanPham: productInfo.price,
        MaDonVi: productInfo.MaDonVi,
      };

      // Gửi yêu cầu thêm chi tiết phiếu xuất
      const detailResponse = await fetch(
        "http://localhost:3000/api/chitietphieuxuat",
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
          `Không thể thêm chi tiết phiếu xuất: ${errorData.message}`
        );
      }
    });

    await Promise.all(productPromises);
    alert("Phiếu xuất và sản phẩm đã được thêm thành công.");
    document.getElementById("export-form").reset();
    selectedProducts = [];
    updateSelectedProducts();
  } catch (error) {
    console.error("Lỗi khi thêm phiếu xuất:", error);
    alert(error.message);
  }
}

// Hàm lấy thông tin phiếu xuất từ form
function getExportDetailsFromForm() {
  // Kiểm tra xem có sản phẩm nào đã được chọn không
  if (selectedProducts.length === 0) {
    console.error("Không có sản phẩm nào được chọn.");
    return null; // Trả về null nếu không có sản phẩm nào
  }

  const exportId = document.getElementById("export-id").value.trim();
  const customerId = document.getElementById("customer").value.trim(); // Khách hàng
  const employeeId = document.getElementById("employee").value.trim();
  const dateCreated = document.getElementById("date-create").value.trim();
  const description = document.getElementById("description").value.trim();

  // Kiểm tra tất cả các trường có giá trị hợp lệ
  if (!exportId || !customerId || !employeeId || !dateCreated) {
    console.error("Thiếu thông tin cần thiết.");
    return null; // Trả về null nếu thiếu thông tin
  }

  return {
    MaPhieuXuat: exportId,
    MaKhachHang: customerId, // Khách hàng
    MaNhanVien: employeeId,
    NgayXuat: dateCreated, // Ngày xuất
    MoTa: description,
    // TongGiaTri: calculateTotalValue(), // Tính tổng giá trị
  };
}

// Hàm tính tổng giá trị phiếu xuất
// function calculateTotalValue() {
//   return selectedProducts.reduce((total, productInfo) => total, 0);
// }

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

// Hàm tải khách hàng
async function loadCustomers() {
  try {
    const response = await fetch("http://localhost:3000/api/khachhang");
    const customers = await response.json();
    populateCustomerSelect(customers);
  } catch (error) {
    console.error("Lỗi khi tải khách hàng:", error);
  }
}

// Hàm điền khách hàng vào select
function populateCustomerSelect(customers) {
  const customerSelect = document.getElementById("customer");
  customers.forEach((customer) => {
    const option = document.createElement("option");
    option.value = customer.MaKhachHang;
    option.textContent = customer.TenKhachHang; // Tên khách hàng
    customerSelect.appendChild(option);
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
    option.value = employee.MaNhanVien;
    option.textContent = employee.TenNhanVien; // Tên nhân viên
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
  const productInfo = {
    uniqueId: `${product.MaSanPham}-${selectedProducts.length + 1}`, // Đảm bảo uniqueId là duy nhất
    MaSanPham: product.MaSanPham,
    quantity: 1,
    MaDonVi: product.MaDonVi, // Đơn vị được chọn
    // price: product.GiaSanPham, // Giá được chọn
  };

  // Thêm sản phẩm vào danh sách đã chọn
  selectedProducts.push(productInfo);
  updateSelectedProducts(); // Cập nhật giao diện hiển thị danh sách sản phẩm đã chọn
  filterProducts(); // Cập nhật lại danh sách sản phẩm
  document.getElementById("product-list").style.display = "none"; // Ẩn danh sách sản phẩm
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

              <th>Hành động</th>
          </tr>
      </thead>
      <tbody>
  `;

  let totalValue = 0; // Biến lưu tổng giá trị

  selectedProducts.forEach((productInfo) => {
    const product = window.productsList.find(
      (p) => p.MaSanPham === productInfo.MaSanPham
    );
    if (product) {
      const quantity = productInfo.quantity; // Lấy số lượng từ thông tin sản phẩm
      // const price = productInfo.price; // Lấy giá từ thông tin sản phẩm
      // const totalPrice = price * quantity; // Tính thành tiền

      // totalValue += totalPrice; // Cộng dồn vào tổng giá trị

      const row = document.createElement("tr");
      row.innerHTML = `
              <td>${index++}</td>
              <td>${product.MaSanPham}</td>
              <td>${product.TenSanPham}</td>
              <td>
                  <select id="${
                    productInfo.uniqueId
                  }-unit" onchange="updateUnit('${
        productInfo.uniqueId
      }', this.value)">
                    <option value="" disabled ${
                      !productInfo.MaDonVi ? "selected" : ""
                    }>Chọn đơn vị</option>
                    ${unitOfMeasurements
                      .map(
                        (unit) => `
                        <option value="${unit.MaDonVi}" ${
                          unit.MaDonVi === productInfo.MaDonVi ? "selected" : ""
                        }>${unit.TenDonVi}</option>
                    `
                      )
                      .join("")}
                  </select>
              </td>
              <td>
                  <input type="number" id="${
                    productInfo.uniqueId
                  }-quantity" value="${quantity}" min="1" onchange="setQuantity('${
        productInfo.uniqueId
      }', this.value)" />
              </td>
              
              <td><button onclick="removeProduct('${
                productInfo.uniqueId
              }')">Xóa</button></td>
          `;
      productTable.querySelector("tbody").appendChild(row);
    }
  });

  productTable.innerHTML += `</tbody>`;
  selectedProductsDiv.appendChild(productTable);

  // Cập nhật tổng giá trị vào phiếu xuất
  // document.getElementById(
  //   "total-price"
  // ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;
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
function updateUnit(uniqueId, unitId) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    productInfo.MaDonVi = unitId; // Cập nhật mã đơn vị
    updateSelectedProducts(); // Cập nhật bảng
  }
}

function setQuantity(uniqueId, value) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    const quantity = Math.max(1, parseInt(value, 10)); // Đảm bảo số lượng không âm
    productInfo.quantity = quantity; // Cập nhật số lượng

    // Cập nhật lại thành tiền
    const totalPrice = productInfo.price * quantity;
    document.getElementById(`${productInfo.uniqueId}-total`).textContent =
      totalPrice.toLocaleString() + " đ";

    updateSelectedProducts(); // Cập nhật lại bảng
  }
}

function updatePrice(uniqueId, value) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    const price = Math.max(0, parseFloat(value)); // Đảm bảo giá không âm
    productInfo.price = price; // Cập nhật giá

    // Cập nhật lại thành tiền
    const totalPrice = price * productInfo.quantity;
    document.getElementById(`${uniqueId}-total`).textContent =
      totalPrice.toLocaleString() + " đ";

    // Cập nhật tổng giá trị vào phiếu xuất
    const totalValue = calculateTotalValue();
    document.getElementById(
      "total-price"
    ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;

    updateSelectedProducts(); // Cập nhật lại bảng
  }
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
  loadCustomers();
  fetchUnitOfMeasurements();
  suggestNextExportId(); // Gợi ý mã phiếu xuất khi trang tải
  loadProducts(); // Tải sản phẩm
  loadEmployees();

  // Gọi hàm lọc sản phẩm khi người dùng nhập vào ô tìm kiếm
  document
    .getElementById("search-product")
    .addEventListener("input", filterProducts);

  // Gọi hàm khi thêm phiếu xuất
  document.getElementById("add-button").addEventListener("click", addExport);
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
