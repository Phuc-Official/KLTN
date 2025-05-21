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
    const response = await fetch(`${BACKEND_URL}/nhacungcap`);
    if (!response.ok) {
      throw new Error("Không thể tải danh sách nhà cung cấp");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải nhà cung cấp:", error);
    return [];
  }
}

async function loadEmployees() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhanvien`);
    if (!response.ok) {
      throw new Error("Không thể tải danh sách nhân viên");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải nhân viên:", error);
    return [];
  }
}

async function fetchProductLocations(maSanPham) {
  try {
    const response = await fetch(`${BACKEND_URL}/vitrikho/${maSanPham}`);
    if (!response.ok) {
      throw new Error(`Không thể tải vị trí cho sản phẩm ${maSanPham}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải vị trí kho:", error);
    return [];
  }
}

async function fetchConversionRate(maSanPham, donViKhacId) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/donvikhac/by-product/${maSanPham}/${donViKhacId}`
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

// ==== Gợi ý mã phiếu nhập mới ====
function generateNextReceiptId(maxId) {
  const prefix = maxId.slice(0, 2);
  const currentNumber = parseInt(maxId.slice(2), 10);
  const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
  return prefix + nextNumber;
}

async function suggestNextReceiptId() {
  try {
    const response = await fetch(`${BACKEND_URL}/phieunhap/max-maphieunhap`);
    const data = await response.json();
    const nextReceiptId = data.maxMaPhieuNhap
      ? generateNextReceiptId(data.maxMaPhieuNhap)
      : "PN0001";

    document.getElementById("receipt-id").value = nextReceiptId;
  } catch (error) {
    console.error("Lỗi khi gợi ý mã phiếu nhập:", error);
  }
}

// Biến toàn cục để lưu thông tin sản phẩm từ URL
let productsFromUrl = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Gợi ý mã phiếu nhập mới
  await suggestNextReceiptId();

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

  // Hiển thị sản phẩm đã chọn
  if (productsJson) {
    productsFromUrl = JSON.parse(decodeURIComponent(productsJson));
    displaySelectedProducts(productsFromUrl);
  }
});

async function displaySelectedProducts(products) {
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
        <th>Vị trí lưu</th>
      </tr>
    </thead>
    <tbody>
  `;

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const row = document.createElement("tr");

    const locations = await fetchProductLocations(product.MaSanPham);

    const locationSelectHtml = `
      <select id="${
        product.MaSanPham
      }-storage-location" class="location-select" data-product-id="${
      product.MaSanPham
    }">
        <option value="" disabled selected>Chọn vị trí lưu trữ</option>
        ${locations
          .map((location) => {
            const soLuong = location.SoLuong !== null ? location.SoLuong : 0;
            const sucChua = location.SucChua !== null ? location.SucChua : 0;
            const conTrong = sucChua - soLuong;

            return `
              <option value="${location.MaViTri}">
                ${location.MaViTri}, Còn trống ${conTrong}
              </option>
            `;
          })
          .join("")}
      </select>
    `;

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
      <td>${locationSelectHtml}</td>
    `;

    productTable.querySelector("tbody").appendChild(row);
  }

  productListDiv.appendChild(productTable);
}

function updateProductQuantity(input, maSanPham) {
  const newQuantity = input.value;
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
    try {
      const receiptId = document.getElementById("receipt-id").value.trim();
      const params = getQueryParams();

      const supplierId = params.supplier;
      const employeeId = params.employee;
      const description = document.getElementById("description").value.trim();
      const orderId = params.orderId; // Mã đơn hàng dùng để cập nhật trạng thái nếu có

      if (!receiptId || !supplierId || !employeeId) {
        alert("Vui lòng điền đầy đủ thông tin phiếu nhập!");
        return;
      }

      // Lấy danh sách sản phẩm từ bảng
      const productRows = document.querySelectorAll(
        "#selected-products tbody tr"
      );
      const products = Array.from(productRows).map((row, index) => {
        const maSanPham = row.cells[1].textContent.trim();
        const soLuongInput = row.cells[4].querySelector("input");
        const soLuong = parseInt(soLuongInput.value.trim(), 10);
        const locationSelect = row.cells[5].querySelector(
          "select.location-select"
        );
        const maViTri = locationSelect ? locationSelect.value : null;
        const originalProduct = productsFromUrl[index] || {};

        return {
          MaSanPham: maSanPham,
          TenSanPham: row.cells[2].textContent.trim(),
          SoLuong: soLuong,
          MaDonViKhac: originalProduct.MaDonViKhac || null,
          MaViTri: maViTri,
        };
      });

      // Kiểm tra xem tất cả sản phẩm đã có vị trí lưu trữ chưa
      const missingLocation = products.find((p) => !p.MaViTri);
      if (missingLocation) {
        alert(
          `Vui lòng chọn vị trí lưu trữ cho sản phẩm ${missingLocation.MaSanPham}`
        );
        return;
      }

      const receiptData = {
        MaPhieuNhap: receiptId,
        MaNhaCungCap: supplierId,
        MaNhanVien: employeeId,
        NgayNhap: document.getElementById("date-create").value,
        MoTa: description,
        products,
      };

      console.log("Dữ liệu phiếu nhập sẽ được gửi:", receiptData);

      // Kiểm tra mã phiếu nhập đã tồn tại chưa
      const checkResponse = await fetch(
        `${BACKEND_URL}/phieunhap/${receiptId}`
      );
      if (checkResponse.ok) {
        throw new Error("Mã phiếu nhập đã tồn tại!");
      }

      // Tạo phiếu nhập mới
      const createResponse = await fetch(`${BACKEND_URL}/phieunhap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Lỗi khi lưu phiếu nhập: ${errorData.message}`);
      }

      // Lưu chi tiết phiếu nhập từng sản phẩm
      await Promise.all(
        products.map(async (product) => {
          const detailResponse = await fetch(
            `${BACKEND_URL}/chitietphieunhap`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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

      // Gộp số lượng thực tế đã quy đổi theo MaSanPham + MaViTri
      const quantityMap = {}; // key: MaSanPham|MaViTri, value: tổng số lượng thực tế
      const messages = [];

      for (const product of products) {
        const soLuong = product.SoLuong;
        let soLuongThucTe = soLuong;
        let tenDonVi = "Chuẩn";
        let donViHienThi = "";

        if (product.MaDonViKhac) {
          const tyLeQuyDoi = await fetchConversionRate(
            product.MaSanPham,
            product.MaDonViKhac
          );
          if (!tyLeQuyDoi) {
            throw new Error(
              `Không tìm thấy tỷ lệ quy đổi cho sản phẩm ${product.MaSanPham}`
            );
          }
          soLuongThucTe = soLuong * tyLeQuyDoi;

          const originalProduct = productsFromUrl.find(
            (p) =>
              p.MaSanPham === product.MaSanPham &&
              p.MaDonViKhac === product.MaDonViKhac
          );
          tenDonVi = originalProduct?.TenDonVi || "Không xác định";
          donViHienThi = tenDonVi;
        } else {
          donViHienThi = "Chuẩn";
        }

        const msg =
          `- ${product.TenSanPham} (${product.MaSanPham}):\n` +
          `  + Vị trí: ${product.MaViTri}\n` +
          `  + Số lượng thêm: ${soLuong} ${donViHienThi} (tương đương ${soLuongThucTe} đơn vị gốc)\n\n`;

        messages.push(msg);
        console.log(msg);

        const key = `${product.MaSanPham}|${product.MaViTri}`;
        quantityMap[key] = (quantityMap[key] || 0) + soLuongThucTe;
      }

      // Cập nhật tồn kho vị trí và tổng tồn kho sản phẩm
      await Promise.all(
        Object.entries(quantityMap).map(async ([key, totalSoLuong]) => {
          const [maSanPham, maViTri] = key.split("|");
          await updateProductQuantityInStorage(
            maSanPham,
            maViTri,
            totalSoLuong
          );
          // await updateProductStock(maSanPham, totalSoLuong);
          //
        })
      );

      // Cập nhật trạng thái đơn hàng nếu có mã đơn hàng
      if (orderId) {
        await updateOrderStatus(orderId);
      }

      // Hiển thị thông báo chi tiết
      alert(
        "Lưu phiếu nhập thành công!\n\nChi tiết lưu kho:\n\n" +
          messages.join("\n")
      );

      // Chuyển về trang danh sách phiếu nhập
      window.location.href = "receiptList.html";
    } catch (error) {
      console.error("Lỗi:", error);
      alert(error.message);
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date-create").value = new Date()
    .toISOString()
    .slice(0, 10);
});

function getTodayFormatted() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  // Đổi thành ISO yyyy-mm-dd
  return `${year}-${month}-${day}`;
}

async function updateProductQuantityInStorage(maSanPham, maViTri, soLuong) {
  try {
    const response = await fetch(`${BACKEND_URL}/capnhatsoluong`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maSanPham: maSanPham,
        maViTri: maViTri,
        soLuong: soLuong,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Cập nhật vị trí thất bại");
    }
  } catch (error) {
    console.error("Lỗi cập nhật số lượng vị trí:", error);
    throw error;
  }
}
async function updateOrderStatus(maDonHang) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/donhang/${maDonHang}/capnhat-trangthai`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ TrangThai: "Đã nhập" }),
      }
    );

    if (!response.ok) {
      throw new Error("Không thể cập nhật trạng thái đơn hàng");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
  }
}

async function updateProductStock(maSanPham, soLuong) {
  try {
    const response = await fetch(`${BACKEND_URL}/capnhatton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maSanPham, soLuong }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi cập nhật SoLuongTon.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật tồn kho sản phẩm:", error);
    throw error;
  }
}

async function getTenDonViByMaSanPhamVaMaDonViKhac(maSanPham, maDonViKhac) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/donvikhac/by-product/${maSanPham}/${maDonViKhac}`
    );
    if (!response.ok) throw new Error("Không thể lấy tên đơn vị");

    const donVi = await response.json();

    // Giả sử API trả về 1 object { MaDonViKhac, TenDonVi, ... }
    return donVi.TenDonVi || "Không xác định";
  } catch (error) {
    console.error("Lỗi khi lấy tên đơn vị:", error);
    return "Không xác định";
  }
}
