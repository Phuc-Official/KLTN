let selectedProductIds = new Set();
let productSelectCount = {};
let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính
const today = new Date().toISOString().split("T")[0];

// Hàm quay về trang trước
function cancel() {
  window.history.back();
}

// async function fetchUnitOfMeasurements() {
//   try {
//     const response = await fetch("http://localhost:3000/api/donvitinh");
//     if (!response.ok) {
//       throw new Error("Không thể tải danh sách đơn vị tính.");
//     }
//     unitOfMeasurements = await response.json(); // Lưu trữ đơn vị tính vào mảng
//   } catch (error) {
//     console.error("Lỗi khi tải đơn vị tính:", error);
//   }
// }

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

  if (!receipt) {
    alert("Vui lòng điền đầy đủ thông tin phiếu nhập.");
    return;
  }

  try {
    // Kiểm tra thông tin vị trí kho và số lượng trước khi tạo phiếu nhập
    const validationPromises = selectedProducts.map(async (productInfo) => {
      const storageLocationId = document.getElementById(
        `${productInfo.uniqueId}-storage-location`
      ).value; // Lấy mã vị trí đã chọn

      if (!storageLocationId) {
        throw new Error(
          `Vui lòng chọn vị trí lưu trữ cho sản phẩm ${productInfo.TenSanPham}`
        );
      }

      const conversionRate = await fetchConversionRate(
        productInfo.MaSanPham,
        productInfo.MaDonVi
      );

      if (conversionRate === null) {
        throw new Error("Không tìm thấy tỷ lệ quy đổi cho sản phẩm này.");
      }

      const quantityToUpdate = productInfo.quantity * conversionRate; // Tính số lượng cần cập nhật

      // Lấy thông tin vị trí kho để kiểm tra sức chứa
      const selectedLocation = productInfo.storageLocations.find(
        (loc) => loc.MaViTri === storageLocationId
      );

      if (!selectedLocation) {
        throw new Error("Không tìm thấy vị trí kho đã chọn.");
      }

      // Lấy số lượng hiện có tại vị trí kho
      const currentQuantityResponse = await fetch(
        `http://localhost:3000/api/vitri/${storageLocationId}/currentQuantity`
      );

      if (!currentQuantityResponse.ok) {
        throw new Error("Không thể lấy số lượng hiện có tại vị trí kho.");
      }

      const currentQuantityData = await currentQuantityResponse.json();
      const currentQuantity = currentQuantityData.SoLuong || 0;

      // Kiểm tra tổng số lượng
      const totalQuantity = currentQuantity + quantityToUpdate;
      if (totalQuantity > selectedLocation.SucChua) {
        throw new Error(
          `Tổng số lượng (${totalQuantity}) vượt quá sức chứa (${selectedLocation.SucChua}) của vị trí ${storageLocationId}.`
        );
      }
    });

    // Chờ tất cả các phép kiểm tra
    await Promise.all(validationPromises);

    // Trong hàm addReceipt(), trước khi gọi API
    console.log("Dữ liệu phiếu nhập:", receipt);
    console.log("Danh sách sản phẩm:", selectedProducts);

    // Trong hàm updateProductQuantityInStorage
    // console.log("Cập nhật số lượng:", {
    //   maSanPham,
    //   maViTri,
    //   soLuong,
    // });

    // Trong hàm fetchConversionRate
    // console.log(
    //   `Lấy tỷ lệ quy đổi cho sản phẩm ${maSanPham} và đơn vị ${donViKhacId}`
    // );

    // Tạo phiếu nhập chính
    const response = await fetch("http://localhost:3000/api/phieunhap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(receipt),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Không thể thêm phiếu nhập: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    const receiptId = result.MaPhieuNhap;

    // Xử lý từng sản phẩm
    const productPromises = selectedProducts.map(async (productInfo) => {
      // 1. Thêm chi tiết phiếu nhập
      const productDetails = {
        MaPhieuNhap: receiptId,
        MaSanPham: productInfo.MaSanPham,
        SoLuong: productInfo.quantity,
        MaDonViKhac: productInfo.MaDonVi,
        MaViTri: document.getElementById(
          `${productInfo.uniqueId}-storage-location`
        ).value,
      };

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

      // 2. Cập nhật số lượng trong kho
      const conversionRate = await fetchConversionRate(
        productInfo.MaSanPham,
        productInfo.MaDonVi
      );

      const quantityToUpdate = productInfo.quantity * conversionRate;
      const storageLocationId = document.getElementById(
        `${productInfo.uniqueId}-storage-location`
      ).value;

      await updateProductQuantityInStorage(
        productInfo.MaSanPham,
        storageLocationId,
        quantityToUpdate
      );
    });

    await Promise.all(productPromises);
    // Sửa lại phần thông báo thành công
    let successMessage = `Phiếu nhập ${receiptId} đã được thêm thành công.\n\nChi tiết:\n`;

    for (const productInfo of selectedProducts) {
      const storageLocationId = document.getElementById(
        `${productInfo.uniqueId}-storage-location`
      ).value;

      const selectedLocation = productInfo.storageLocations.find(
        (loc) => loc.MaViTri === storageLocationId
      );

      const conversionRate = await fetchConversionRate(
        productInfo.MaSanPham,
        productInfo.MaDonVi
      );

      const actualQuantity = productInfo.quantity * conversionRate;

      successMessage += `- ${productInfo.TenSanPham} (${productInfo.MaSanPham}):\n`;
      successMessage += `  + Vị trí: ${storageLocationId}\n`;
      successMessage += `  + Số lượng thêm: ${productInfo.quantity} ${
        productInfo.selectedUnitName || ""
      } (tương đương ${actualQuantity} đơn vị gốc)\n\n`;
    }

    alert(successMessage);

    // Reset form và danh sách sản phẩm
    document.getElementById("receipt-form").reset();
    selectedProducts = [];
    updateSelectedProducts();

    // Gợi ý mã phiếu nhập mới
    suggestNextReceiptId();
    window.location.href = "receiptList.html";
  } catch (error) {
    console.error("Lỗi khi thêm phiếu nhập:", error);
    alert(`Lỗi: ${error.message}`);
  }
}

// Hàm cập nhật số lượng trong kho (cần sửa lại)
async function updateProductQuantityInStorage(maSanPham, maViTri, soLuong) {
  try {
    const response = await fetch("http://localhost:3000/api/capnhatsoluong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maSanPham, maViTri, soLuong }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi cập nhật số lượng.");
    }

    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng:", error);
    throw error;
  }
}

// Hàm lấy thông tin phiếu nhập từ form
function getReceiptDetailsFromForm() {
  // Kiểm tra xem có sản phẩm nào đã được chọn không
  if (selectedProducts.length === 0) {
    console.error("Không có sản phẩm nào được chọn.");
    return null; // Trả về null nếu không có sản phẩm nào
  }

  const receiptId = document.getElementById("receipt-id").value.trim();
  const supplierId = document.getElementById("supplier").value.trim();
  const employeeId = document.getElementById("employee").value.trim();
  const dateCreated = document.getElementById("date-create").value.trim();
  const description = document.getElementById("description").value.trim();

  // Kiểm tra tất cả các trường có giá trị hợp lệ
  if (!receiptId || !supplierId || !employeeId || !dateCreated) {
    console.error("Thiếu thông tin cần thiết.");
    return null; // Trả về null nếu thiếu thông tin
  }

  return {
    MaPhieuNhap: receiptId,
    MaNhaCungCap: supplierId,
    MaNhanVien: employeeId,
    NgayNhap: dateCreated,
    MoTa: description,
    // TongGiaTri: calculateTotalValue(), // Tính tổng giá trị
  };
}

// Hàm tính tổng giá trị phiếu nhập
// function calculateTotalValue() {
//   return selectedProducts.reduce((total, productInfo) => total, 0);
// }

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

  // Lấy danh sách đơn vị từ bảng DonViKhac
  productInfo.units = await fetchUnitsByProduct(product.MaSanPham);

  // Tải danh sách vị trí lưu trữ cho sản phẩm
  productInfo.storageLocations = await fetchStorageLocations(product.MaSanPham);

  selectedProducts.push(productInfo);
  updateSelectedProducts();
  filterProducts();
  document.getElementById("product-list").style.display = "none";
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
              <th>Vị trí</th>
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
          <td>
            <select id="${productInfo.uniqueId}-storage-location">
                <option value="" disabled selected>Chọn vị trí lưu trữ</option>
                ${productInfo.storageLocations
                  .map((location) => {
                    const soLuong =
                      location.SoLuong !== null ? location.SoLuong : 0;
                    const sucChua =
                      location.SucChua !== null ? location.SucChua : 0;
                    const conTrong = sucChua - soLuong;

                    return `
                    <option value="${location.MaViTri}">
                        ${location.MaViTri}, Còn trống ${conTrong}
                    </option>
                    `;
                  })
                  .join("")}
            </select>
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

async function fetchUnitsByProduct(maSanPham) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvitinhkhac/${maSanPham}`
    );
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách đơn vị tính.");
    }
    const units = await response.json(); // Giả sử dữ liệu có cấu trúc { ID, TenDonVi }

    return units;
  } catch (error) {
    console.error("Lỗi khi lấy đơn vị:", error);
    return [];
  }
}

async function fetchStorageLocations(maSanPham) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/vitrikho/${maSanPham}`
    );
    if (!response.ok) {
      throw new Error("Không thể lấy danh sách vị trí lưu trữ.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy vị trí lưu trữ:", error);
    return [];
  }
}

// Hàm lấy tỷ lệ quy đổi từ DonViKhac
async function fetchConversionRate(maSanPham, donViKhacId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvikhac/by-product/${maSanPham}/${donViKhacId}`
    );
    if (!response.ok) {
      throw new Error("Không thể lấy tỷ lệ quy đổi.");
    }
    const data = await response.json();

    // Kiểm tra nếu không tìm thấy tỷ lệ quy đổi
    if (!data || !data.TyLeQuyDoi) {
      throw new Error("Không tìm thấy tỷ lệ quy đổi cho sản phẩm này.");
    }

    return data.TyLeQuyDoi; // Trả về tỷ lệ quy đổi
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    return null; // Trả về null nếu có lỗi
  }
}

// Hàm cập nhật số lượng vào ViTriKho
async function updateProductQuantityInStorage(maSanPham, maViTri, soLuong) {
  try {
    const response = await fetch("http://localhost:3000/api/capnhatsoluong", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maSanPham: maSanPham,
        maViTri: maViTri, // Thêm mã vị trí
        soLuong: soLuong,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi cập nhật số lượng.");
    }

    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng:", error);
    throw error;
  }
}

async function updateStorageLocation(uniqueId, locationId) {
  const productInfo = selectedProducts.find((p) => p.uniqueId === uniqueId);

  if (productInfo && locationId) {
    const selectedLocation = productInfo.storageLocations.find(
      (loc) => loc.MaViTri === locationId
    );

    if (selectedLocation) {
      // Cập nhật vị trí đã chọn vào productInfo
      productInfo.selectedLocationId = locationId;

      console.log(
        `Đã chọn vị trí ${selectedLocation.MaViTri} cho sản phẩm ${productInfo.MaSanPham}`
      );
    }
  }
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
    productInfo.MaDonVi = unitId;

    // Thêm kiểm tra null
    if (productInfo.units && unitId) {
      const selectedUnit = productInfo.units.find(
        (unit) => unit.ID === parseInt(unitId, 10)
      );
      if (selectedUnit) {
        productInfo.selectedUnitName = selectedUnit.TenDonVi;
      }
    }

    updateSelectedProducts();
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

    // Cập nhật tổng giá trị vào phiếu nhập
    // const totalValue = calculateTotalValue();
    // document.getElementById(
    //   "total-price"
    // ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;

    // updateSelectedProducts(); // Gọi hàm cập nhật
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
    // const totalValue = calculateTotalValue();
    // document.getElementById(
    //   "total-price"
    // ).textContent = `Tổng giá trị: ${totalValue.toLocaleString()} đ`;

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
  // fetchReceipts();
  loadSuppliers();
  // fetchUnitOfMeasurements();
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

{
  /* <td>
                  <input type="number" id="${
                    productInfo.uniqueId
                  }-price" value="${price}" min="0" onchange="updatePrice('${
        productInfo.uniqueId
      }', this.value)" />
              </td>
              <td id="${
                productInfo.uniqueId
              }-total">${totalPrice.toLocaleString()} đ</td> */
}
