let selectedProductIds = new Set();
let productSelectCount = {};
let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính
const today = new Date().toISOString().split("T")[0];
let selectedProducts = []; // Mảng để lưu trữ thông tin sản phẩm đã chọn

// Hàm quay về trang trước
function cancel() {
  window.history.back();
}

// Hàm gợi ý mã phiếu kiểm kê
async function suggestNextSheetId() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieukiemke/max-maphieu`);
    const data = await response.json();

    // Kiểm tra dữ liệu trả về
    if (!data || !data.maxMaPhieuKiemKe) {
      console.warn(
        "Không tìm thấy mã phiếu kiểm kê lớn nhất, sử dụng mặc định KK0001"
      );
      document.getElementById("sheet-id").value = "KK0001"; // Giá trị mặc định
      return;
    }

    const nextSheetId = generateNextSheetId(data.maxMaPhieuKiemKe);

    // Kiểm tra xem mã này đã tồn tại hay chưa
    const isExisting = await checkIfSheetIdExists(nextSheetId);

    if (isExisting) {
      console.warn("Mã đã tồn tại, gợi ý mã mới.");
      return suggestNextSheetId(); // Gọi lại để tạo mã mới
    }

    document.getElementById("sheet-id").value = nextSheetId; // Hiển thị mã phiếu kiểm kê gợi ý
  } catch (error) {
    console.error("Lỗi khi gợi ý mã phiếu kiểm kê:", error);
  }
}

function generateNextSheetId(maxId) {
  const prefix = maxId.slice(0, 2); // Lấy tiền tố (KK)
  const currentNumber = parseInt(maxId.slice(2), 10); // Chuyển đổi phần số thành số nguyên
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0"); // Tăng số và định dạng
  return prefix + nextNumber; // Trả về mã tiếp theo
}

async function checkIfSheetIdExists(sheetId) {
  try {
    const response = await fetch(`${BACKEND_URL}/phieukiemke/${sheetId}`);
    return response.ok; // Trả về true nếu mã đã tồn tại
  } catch (error) {
    console.error("Lỗi khi kiểm tra mã phiếu kiểm kê:", error);
    return false;
  }
}

// Hàm tạo mã phiếu kiểm kê tiếp theo
function generateNextSheetId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
  return prefix + nextNumber;
}

// Hàm thêm phiếu kiểm kê

// async function addSheet() {
//   const sheet = getSheetDetailsFromForm();

//   if (!sheet) {
//     alert("Vui lòng điền đầy đủ thông tin phiếu kiểm kê.");
//     return;
//   }

//   try {
//     const response = await fetch("${BACKEND_URL}/phieukiemke", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(sheet),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(
//         `Không thể thêm phiếu kiểm kê: ${
//           errorData.message || response.statusText
//         }`
//       );
//     }

//     const result = await response.json();
//     const sheetId = result.MaPhieuKiemKe;

//     // Cập nhật chi tiết phiếu kiểm kê cho từng sản phẩm
//     const productPromises = selectedProducts.map(async (productInfo) => {
//       const productDetails = {
//         MaPhieuKiemKe: sheetId,
//         MaSanPham: productInfo.MaSanPham,
//         SoLuong: productInfo.quantity,
//         MaDonVi: productInfo.MaDonVi,
//       };

//       // Gửi yêu cầu thêm chi tiết phiếu kiểm kê
//       const detailResponse = await fetch(
//         "${BACKEND_URL}/chitietphieukiemke",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(productDetails),
//         }
//       );

//       if (!detailResponse.ok) {
//         const errorData = await detailResponse.json();
//         throw new Error(
//           `Không thể thêm chi tiết phiếu kiểm kê: ${errorData.message}`
//         );
//       }
//     });

//     await Promise.all(productPromises);
//     alert("Phiếu kiểm kê và sản phẩm đã được thêm thành công.");
//     document.getElementById("sheet-form").reset();
//     selectedProducts = [];
//     updateSelectedProducts();
//   } catch (error) {
//     console.error("Lỗi khi thêm phiếu kiểm kê:", error);
//     alert(error.message);
//   }
// }

// Hàm lấy thông tin phiếu kiểm kê từ form

function getSheetDetailsFromForm() {
  const sheetId = document.getElementById("sheet-id").value.trim();
  const sheetName = document.getElementById("sheet-name").value.trim();
  const employeeId = document.getElementById("employee-id").value.trim(); // lấy từ input ẩn
  const dateCreated = document.getElementById("date-create").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!sheetId || !employeeId || !dateCreated) {
    console.error("Thiếu thông tin cần thiết.");
    return null;
  }

  return {
    MaPhieuKiemKe: sheetId,
    TenPhieu: sheetName,
    MaNhanVien: employeeId,
    NgayTao: dateCreated,
    MoTa: description,
  };
}

// Hàm tải nhân viên
function loadCurrentEmployee() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      throw new Error("Chưa có thông tin nhân viên đăng nhập.");
    }

    // Hiển thị tên nhân viên
    const employeeNameInput = document.getElementById("employee-name");
    employeeNameInput.value = currentUser.TenNhanVien;

    // Lưu mã nhân viên vào input ẩn
    const employeeIdInput = document.getElementById("employee-id");
    employeeIdInput.value = currentUser.MaNhanVien;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhân viên đăng nhập:", error);
  }
}

// Hàm điền nhân viên vào select
function populateEmployeeSelect(employees) {
  const employeeSelect = document.getElementById("employee");
  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.MaNhanVien;
    option.textContent = employee.TenNhanVien;
    employeeSelect.appendChild(option);
  });
}

// Hàm tải sản phẩm
async function loadProducts() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham`);
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
    SoLuongTon: product.SoLuongTon, // Lưu số lượng tồn
    MaDonVi: product.MaDonVi, // Đơn vị được chọn
    quantity: product.SoLuongTon, // Khởi tạo số lượng quy đổi bằng số lượng tồn
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

  const productTable = document.createElement("table");
  productTable.innerHTML = `
      <thead>
          <tr>
              <th>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>



              <th>Hành động</th>
          </tr>
      </thead>
      <tbody>
  `;

  selectedProducts.forEach((productInfo) => {
    const product = window.productsList.find(
      (p) => p.MaSanPham === productInfo.MaSanPham
    );
    if (product) {
      const row = document.createElement("tr");
      row.innerHTML = `
              <td>${product.MaSanPham}</td>
              <td>${product.TenSanPham}</td>                                     
              <td><button onclick="removeProduct('${productInfo.uniqueId}')">Xóa</button></td>
          `;
      productTable.querySelector("tbody").appendChild(row);
    }
  });

  productTable.innerHTML += `</tbody>`;
  selectedProductsDiv.appendChild(productTable);
}

// Hàm thiết lập số lượng từ ô nhập
function setQuantity(uniqueId, value) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    const quantity = parseInt(value, 10); // Parse the value
    if (isNaN(quantity) || quantity < 1) {
      productInfo.quantity = 1; // Set to default if invalid
    } else {
      productInfo.quantity = quantity; // Update quantity
    }
    updateSelectedProducts(); // Cập nhật lại bảng
  }
}

// Hàm cập nhật đơn vị
function updateUnit(uniqueId, unitId) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);
  if (productInfo) {
    productInfo.MaDonVi = unitId; // Cập nhật mã đơn vị

    // Tìm tỷ lệ quy đổi từ danh sách đơn vị tính
    const unit = unitOfMeasurements.find((u) => u.MaDonVi === unitId);
    if (unit) {
      const conversionRate = unit.TyleQuyDoi; // Giả sử có trường tỷ lệ quy đổi

      // Tính toán số lượng quy đổi bằng cách chia
      const convertedQuantity = Math.floor(
        productInfo.SoLuongTon / conversionRate
      );

      productInfo.quantity = convertedQuantity >= 0 ? convertedQuantity : 0; // Cập nhật số lượng quy đổi
    } else {
      productInfo.quantity = productInfo.SoLuongTon; // Nếu không tìm thấy đơn vị, giữ nguyên số lượng tồn
    }

    updateSelectedProducts(); // Cập nhật bảng
  }
}

function selectAllProducts() {
  if (!window.productsList) {
    console.error("Danh sách sản phẩm chưa được tải.");
    return;
  }

  window.productsList.forEach((product) => {
    // Kiểm tra nếu sản phẩm đã chọn chưa
    const alreadySelected = selectedProducts.some(
      (p) => p.MaSanPham === product.MaSanPham
    );
    if (!alreadySelected) {
      const productInfo = {
        uniqueId: `${product.MaSanPham}-${selectedProducts.length + 1}`,
        MaSanPham: product.MaSanPham,
        SoLuongTon: product.SoLuongTon,
        MaDonVi: product.MaDonVi,
        quantity: product.SoLuongTon,
      };
      selectedProducts.push(productInfo);
    }
  });

  updateSelectedProducts(); // Cập nhật hiển thị danh sách sản phẩm đã chọn
  filterProducts(); // Cập nhật lại danh sách sản phẩm (ẩn các sản phẩm đã chọn)
  document.getElementById("product-list").style.display = "none"; // Ẩn danh sách sản phẩm
}

// Hàm xóa sản phẩm
function removeProduct(uniqueId) {
  selectedProducts = selectedProducts.filter((p) => p.uniqueId !== uniqueId);
  updateSelectedProducts();
}

function redirectToConfirmationPageWithProducts() {
  const sheetDetails = getSheetDetailsFromForm(); // Lấy thông tin phiếu
  if (!sheetDetails) {
    alert("Vui lòng điền đầy đủ thông tin phiếu kiểm kê.");
    return;
  }

  // Log thông tin phiếu
  console.log("Thông tin phiếu kiểm kê:", sheetDetails);
  console.log("Sản phẩm đã chọn:", selectedProducts);

  // Lưu thông tin phiếu và sản phẩm vào localStorage
  localStorage.setItem("sheetDetails", JSON.stringify(sheetDetails));
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  // Chuyển hướng đến trang xác nhận
  window.location.href = "confirmStock.html"; // Đường dẫn đến trang xác nhận
}

function viewSheetDetails(sheetId) {
  window.location.href = `sheetDetail.html?id=${sheetId}`;
}

// Khởi tạo các hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  suggestNextSheetId(); // Gợi ý mã phiếu kiểm kê khi trang tải
  loadProducts(); // Tải sản phẩm
  loadCurrentEmployee();

  // Gọi hàm lọc sản phẩm khi người dùng nhập vào ô tìm kiếm
  document
    .getElementById("search-product")
    .addEventListener("input", filterProducts);

  // Gọi hàm khi thêm phiếu kiểm kê
  // document.getElementById("add-button").addEventListener("click", addSheet);
  document
    .getElementById("confirm")
    .addEventListener("click", redirectToConfirmationPageWithProducts);
  document
    .getElementById("select-all-btn")
    .addEventListener("click", selectAllProducts);
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
