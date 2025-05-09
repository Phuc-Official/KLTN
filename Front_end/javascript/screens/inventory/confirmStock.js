async function fetchProductDetails(productId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/sanpham/${productId}`
    );
    if (!response.ok) {
      throw new Error("Không thể lấy thông tin sản phẩm");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm:", error);
    return null;
  }
}

async function fetchProductUnits(maSanPham) {
  try {
    const response = await fetch(`${BACKEND_URL}/donvitinhkhac/${maSanPham}`);
    if (!response.ok) {
      throw new Error("Không thể lấy thông tin đơn vị sản phẩm");
    }
    const units = await response.json();
    console.log("Thông tin đơn vị tính:", units); // Log thông tin đơn vị tính
    return units;
  } catch (error) {
    console.error("Lỗi khi lấy đơn vị sản phẩm:", error);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const selectedProducts =
    JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const selectedProductsDiv = document.getElementById("selected-products");
  const confirmButton = document.getElementById("confirm-button");

  if (selectedProducts.length === 0) {
    selectedProductsDiv.innerHTML = "<p>Không có sản phẩm nào được chọn.</p>";
  } else {
    const productTable = document.createElement("table");
    productTable.className = "product-table";
    productTable.innerHTML = `
      <thead>
        <tr>
          <th>Mã SP</th>
          <th>Tên SP</th>
          <th>Đơn vị tính</th>
          <th>Số lượng tồn</th>
          <th>Số lượng thực tế</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    for (const product of selectedProducts) {
      const productDetails = await fetchProductDetails(product.MaSanPham);
      const productUnits = await fetchProductUnits(product.MaSanPham);

      if (productDetails) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.MaSanPham}</td>
          <td>${productDetails.TenSanPham || ""}</td>
          <td class="unit-cells"></td>
          <td class="stock-cells"></td>
          <td class="actual-cells"></td>
        `;

        // Thêm các đơn vị tính
        const unitCells = row.querySelector(".unit-cells");
        const stockCells = row.querySelector(".stock-cells");
        const actualCells = row.querySelector(".actual-cells");

        // Sắp xếp đơn vị: đơn vị cơ bản (tỷ lệ 1) lên đầu
        const sortedUnits = [...productUnits].sort(
          (a, b) => a.TyLeQuyDoi - b.TyLeQuyDoi
        );

        sortedUnits.forEach((unit) => {
          // Lấy số lượng tồn tương ứng với từng đơn vị từ bảng DonViKhac
          const stockQuantity = unit.SoLuongTon || 0; // Giả định số lượng tồn được trả về từ API

          // Log số lượng tồn
          console.log(
            `Sản phẩm: ${product.MaSanPham}, Đơn vị: ${unit.TenDonVi}, Số lượng tồn: ${stockQuantity}, Tỷ lệ quy đổi: ${unit.TyLeQuyDoi}`
          );

          // Ô đơn vị - hiển thị tên và tỷ lệ
          const unitDiv = document.createElement("div");
          unitDiv.className = "unit-row";
          unitDiv.innerHTML = `
            ${unit.TenDonVi} (${unit.TyLeQuyDoi})
          `;
          unitCells.appendChild(unitDiv);

          // Ô số lượng tồn
          const stockDiv = document.createElement("div");
          stockDiv.className = "stock-row";
          stockDiv.textContent = stockQuantity;
          stockCells.appendChild(stockDiv);

          // Ô nhập số lượng thực tế
          const actualDiv = document.createElement("div");
          actualDiv.className = "actual-row";
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.value = stockQuantity;
          input.dataset.productId = product.MaSanPham;
          input.dataset.unitId = unit.ID;
          input.dataset.rate = unit.TyLeQuyDoi;
          actualDiv.appendChild(input);
          actualCells.appendChild(actualDiv);
        });

        productTable.querySelector("tbody").appendChild(row);
      }
    }

    selectedProductsDiv.appendChild(productTable);
  }

  // CSS inline cho bảng
  const style = document.createElement("style");
  style.textContent = `
    .product-table {
      width: 100%;
      border-collapse: collapse;
    }
    .product-table th, .product-table td {
      border: 1px solid #ddd;
      padding: 8px;
      vertical-align: top;
    }
    .unit-row, .stock-row, .actual-row {
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }
    .product-table input[type="number"] {
      width: 80px;
      padding: 4px;
    }
  `;
  document.head.appendChild(style);

  confirmButton.addEventListener("click", async () => {
    await createStock();
  });
});

let isSubmitting = false; // Cờ để theo dõi trạng thái gửi

async function createStock() {
  if (isSubmitting) return;
  isSubmitting = true;

  const sheet = JSON.parse(localStorage.getItem("sheetDetails"));
  const selectedProducts = JSON.parse(localStorage.getItem("selectedProducts"));

  if (!sheet || !selectedProducts || selectedProducts.length === 0) {
    alert("Thông tin phiếu hoặc sản phẩm không hợp lệ.");
    isSubmitting = false;
    return;
  }

  try {
    // Tạo phiếu kiểm kê
    const response = await fetch("http://localhost:3000/api/phieukiemke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sheet),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Không thể thêm phiếu kiểm kê: ${errorData.message}`);
    }

    const result = await response.json();
    const sheetId = result.MaPhieuKiemKe;
    console.log("Đã tạo phiếu kiểm kê với ID:", sheetId);

    // Tạo chi tiết phiếu kiểm kê cho từng sản phẩm
    const rows = document.querySelectorAll("#selected-products table tbody tr");

    for (const row of rows) {
      const productId = row.cells[0].textContent;
      const inputs = row.querySelectorAll(".actual-cells input");

      // Lấy tất cả các stock-row và unit-row tương ứng
      const stockRows = row.querySelectorAll(".stock-row");
      const unitRows = row.querySelectorAll(".unit-row");

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const stockRow = stockRows[i];
        const unitRow = unitRows[i];

        if (!stockRow || !unitRow) {
          console.error("Không tìm thấy thông tin tương ứng cho input:", input);
          continue;
        }

        // Lấy thông tin từ data attributes của input
        const unitId = input.dataset.unitId;
        const rate = parseFloat(input.dataset.rate);
        const actualQuantity = parseInt(input.value) || 0;
        const stockQuantity = parseInt(stockRow.textContent) || 0;

        console.log("Chuẩn bị tạo chi tiết phiếu:", {
          MaPhieuKiemKe: sheetId,
          MaSanPham: productId,
          MaDonViKhac: unitId,
          SoLuongThucTe: actualQuantity,
          SoLuongTon: stockQuantity,
          TyLeQuyDoi: rate,
        });

        // Gửi yêu cầu tạo chi tiết phiếu
        const detailResponse = await fetch(
          "http://localhost:3000/api/chitietphieukiemke",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              MaPhieuKiemKe: sheetId,
              MaSanPham: productId,
              MaDonViKhac: unitId,
              SoLuongThucTe: actualQuantity,
              SoLuongTon: stockQuantity,
              TyLeQuyDoi: rate,
            }),
          }
        );

        if (!detailResponse.ok) {
          const errorData = await detailResponse.json();
          throw new Error(`Lỗi khi thêm chi tiết phiếu: ${errorData.message}`);
        }

        console.log("Đã tạo chi tiết phiếu thành công:", {
          MaSanPham: productId,
          MaDonViKhac: unitId,
          SoLuongThucTe: actualQuantity,
        });
      }
    }

    alert("Phiếu kiểm kê và chi tiết đã được tạo thành công!");

    // Xóa dữ liệu tạm
    localStorage.removeItem("selectedProducts");
    localStorage.removeItem("sheetDetails");

    // Chuyển hướng về trang danh sách
    window.location.href = "sheetList.html";
  } catch (error) {
    console.error("Lỗi khi thêm phiếu kiểm kê:", error);
    alert(`Có lỗi xảy ra: ${error.message}`);
  } finally {
    isSubmitting = false;
  }
}

function cancel() {
  window.history.back();
}
