async function fetchProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maSanPham = urlParams.get("id");

  try {
    const response = await fetch(`${BACKEND_URL}/sanpham/${maSanPham}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết sản phẩm.");
    }

    const product = await response.json(); // Phân tích cú pháp JSON
    console.log("Chi tiết sản phẩm:", product); // Log chi tiết sản phẩm

    // Cập nhật các phần tử HTML
    document.getElementById("product-name").innerText = product.TenSanPham;
    document.getElementById("product-id").value = product.MaSanPham;
    document.getElementById("type").value = product.TenNhom;
    document.getElementById("weight").value = product.TrongLuong;
    document.getElementById("description").value = product.MoTaSanPham;

    document
      .getElementById("delete-button")
      .addEventListener("click", deleteProduct);

    // Gọi API để lấy các đơn vị bổ sung
    await fetchAdditionalUnits(maSanPham);
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    const productDetailsElement = document.getElementById("product-details");
    if (productDetailsElement) {
      productDetailsElement.innerHTML =
        "<p>Không thể tải chi tiết sản phẩm.</p>";
    }
  }
}

async function fetchAdditionalUnits(maSanPham) {
  try {
    const response = await fetch(`${BACKEND_URL}/donvitinhkhac/${maSanPham}`);

    if (!response.ok) {
      throw new Error("Không thể tải đơn vị bổ sung");
    }

    const units = await response.json();
    const unitsContainer = document.getElementById("additional-units");
    unitsContainer.innerHTML = ""; // Xóa nội dung cũ

    // Tạo bảng
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Tên đơn vị</th>
          <th>Quy đổi</th>
          <th>Số lượng</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;

    const tbody = table.querySelector("tbody");

    if (Array.isArray(units) && units.length > 0) {
      units.forEach((unit) => {
        console.log("Thông tin đơn vị:", unit); // Log thông tin đơn vị bổ sung

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${unit.TenDonVi}</td>
          <td>${unit.TyLeQuyDoi}</td>
          <td>${unit.SoLuongTon}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      tbody.innerHTML = "<tr><td colspan='3'>Không có đơn vị nào.</td></tr>";
    }

    // Thêm bảng vào container
    unitsContainer.appendChild(table);
  } catch (error) {
    console.error("Lỗi khi tải đơn vị:", error);
    const unitsContainer = document.getElementById("additional-units");
    if (unitsContainer) {
      unitsContainer.innerHTML = "<p>Không thể tải đơn vị.</p>";
    }
  }
}

async function updateConversionTable(originalStock) {
  const conversionBody = document.getElementById("conversion-body");
  if (!conversionBody) {
    console.error("Không tìm thấy phần tử với ID 'conversion-body'");
    return;
  }
  conversionBody.innerHTML = ""; // Xóa nội dung cũ

  // Tạo một mảng chứa thông tin đơn vị và tỷ lệ quy đổi
  const conversionData = await Promise.all(
    unitOfMeasurements.map(async (unit) => {
      const conversionRate = await getConversionRate(unit.MaDonVi);
      const convertedStock = Math.floor(originalStock / conversionRate);
      return {
        unit: unit.TenDonVi,
        convertedStock: convertedStock,
        conversionRate: conversionRate,
      };
    })
  );

  // Sắp xếp mảng dựa theo tỷ lệ quy đổi từ cao đến thấp
  conversionData.sort((a, b) => b.conversionRate - a.conversionRate);

  // Điền dữ liệu vào bảng
  conversionData.forEach((data) => {
    const row = document.createElement("tr");
    const unitCell = document.createElement("td");
    const stockCell = document.createElement("td");

    unitCell.textContent = data.unit; // Đơn vị tính
    stockCell.textContent = data.convertedStock > 0 ? data.convertedStock : "0"; // Số lượng tồn quy đổi

    row.appendChild(unitCell);
    row.appendChild(stockCell);
    conversionBody.appendChild(row); // Thêm hàng vào bảng
  });
}

// Khởi động khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", async () => {
  await fetchProductDetails();
});

function cancel() {
  // Quay về trang trước
  window.history.back();
}

function updateConversionRate(selectElement) {
  const selectedUnitId = selectElement.value;

  // Lấy tỷ lệ quy đổi từ API
  getConversionRate(selectedUnitId).then((conversionRate) => {
    const conversionRateInput = document.getElementById("conversion-rate");
    const convertedStockInput = document.getElementById("converted-stock");

    // Cập nhật tỷ lệ quy đổi vào ô conversion-rate
    conversionRateInput.value = conversionRate > 0 ? conversionRate : "";

    // Lấy số lượng tồn và đảm bảo nó là một số nguyên
    const originalStockValue = document.getElementById(
      "converted-stock-quantity"
    ).value;
    const originalStock = parseInt(originalStockValue, 10);

    if (isNaN(originalStock) || originalStock < 0 || conversionRate <= 0) {
      convertedStockInput.value = ""; // Đặt lại giá trị về chuỗi rỗng nếu có lỗi
      return;
    }

    // Tính số lượng tồn quy đổi
    let convertedStock = originalStock / conversionRate;
    convertedStock = Math.floor(convertedStock);

    // Cập nhật số lượng tồn quy đổi vào ô converted-stock
    convertedStockInput.value = convertedStock;
  });
}

async function getConversionRate(unitId) {
  try {
    const response = await fetch(`${BACKEND_URL}/donvitinh/${unitId}`);
    if (!response.ok) {
      throw new Error(`Không thể lấy tỷ lệ quy đổi cho mã đơn vị: ${unitId}`);
    }
    const data = await response.json();

    // Kiểm tra xem có tỷ lệ quy đổi không
    if (data.TyLeQuyDoi === undefined) {
      throw new Error(
        `Tỷ lệ quy đổi không được xác định cho mã đơn vị: ${unitId}`
      );
    }

    return data.TyLeQuyDoi; // Trả về tỷ lệ quy đổi
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    return 1; // Trả về 1 nếu có lỗi
  }
}

async function deleteProduct() {
  const maSanPham = document.getElementById("product-id").value;
  if (!maSanPham) {
    alert("Không có mã sản phẩm để xóa.");
    return;
  }

  const confirmed = confirm(
    `Bạn có chắc muốn xóa sản phẩm ${maSanPham} không?`
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`${BACKEND_URL}/sanpham/${maSanPham}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert(`Lỗi khi xóa sản phẩm: ${errorText}`);
      return;
    }

    alert("Xóa sản phẩm thành công!");
    // Chuyển về trang danh sách sản phẩm hoặc trang khác
    window.location.href = "productList.html"; // hoặc trang bạn muốn
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    alert("Đã xảy ra lỗi khi xóa sản phẩm.");
  }
}
