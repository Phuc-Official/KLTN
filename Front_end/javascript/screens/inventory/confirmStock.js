async function fetchProductDetails(productId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/sanpham/${productId}`
    ); // Thay đổi đường dẫn nếu cần
    if (!response.ok) {
      throw new Error("Không thể lấy thông tin sản phẩm");
    }
    return await response.json(); // Giả sử API trả về một đối tượng sản phẩm
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm:", error);
    return null; // Trả về null nếu có lỗi
  }
}

async function fetchUnitDetails(unitId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvitinh/${unitId}`
    );

    if (!response.ok) {
      throw new Error("Không thể lấy thông tin đơn vị");
    }

    const unitData = await response.json();

    return {
      TenDonVi: unitData.TenDonVi,
      TyleQuyDoi: unitData.TyleQuyDoi,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn vị:", error);
    return null; // Trả về null nếu có lỗi
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const selectedProducts =
    JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const selectedProductsDiv = document.getElementById("selected-products");
  const confirmButton = document.getElementById("confirm-button");

  // Log dữ liệu sản phẩm từ localStorage
  console.log("Dữ liệu sản phẩm từ localStorage:", selectedProducts);

  if (selectedProducts.length === 0) {
    selectedProductsDiv.innerHTML = "<p>Không có sản phẩm nào được chọn.</p>";
  } else {
    const productTable = document.createElement("table");
    productTable.innerHTML = `
            <thead>
                <tr>
                    <th>Mã sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Đơn vị</th>
                    <th>Số lượng tồn</th>
                    <th>Số lượng thực tế</th>
                </tr>
            </thead>
            <tbody>
        `;

    for (const product of selectedProducts) {
      const productDetails = await fetchProductDetails(product.MaSanPham);
      const unitDetails = await fetchUnitDetails(product.MaDonVi);

      if (productDetails) {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${product.MaSanPham}</td>
                    <td>${productDetails.TenSanPham || ""}</td>
                    <td>${product ? product.MaDonVi : ""}</td>
                    <td>${product.quantity || ""}</td>
                    <td>
                        <input type="number" id="${
                          product.uniqueId
                        }-quantity" value="${
          product.quantity || 0
        }" min="0" class="actual-quantity" />
                    </td>
                    
                `;
        productTable.querySelector("tbody").appendChild(row);
      }
    }

    productTable.innerHTML += `</tbody>`;
    selectedProductsDiv.appendChild(productTable);
  }

  confirmButton.addEventListener("click", async () => {
    // Log thông tin sẽ thêm vào cơ sở dữ liệu
    const sheet = JSON.parse(localStorage.getItem("sheetDetails")); // Lấy thông tin phiếu
    console.log("Thông tin phiếu để thêm:", sheet);

    await createStock();
  });
});

let isSubmitting = false; // Cờ để theo dõi trạng thái gửi

async function createStock() {
  if (isSubmitting) return; // Ngăn không cho gửi yêu cầu nếu đã đang gửi
  isSubmitting = true; // Đặt cờ là đang gửi

  const sheet = JSON.parse(localStorage.getItem("sheetDetails"));
  const selectedProducts = JSON.parse(localStorage.getItem("selectedProducts"));

  if (!sheet || !selectedProducts || selectedProducts.length === 0) {
    alert("Thông tin phiếu hoặc sản phẩm không hợp lệ.");
    isSubmitting = false; // Đặt lại cờ
    return;
  }

  try {
    console.log("Thông tin phiếu kiểm kê:", sheet); // Kiểm tra thông tin phiếu

    const response = await fetch("http://localhost:3000/api/phieukiemke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sheet), // Đảm bảo gửi đúng dữ liệu
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Không thể thêm phiếu kiểm kê: ${errorData.message}`);
    }

    const result = await response.json();
    const sheetId = result.MaPhieuKiemKe;

    const productPromises = selectedProducts.map(async (productInfo) => {
      const quantityInput = document.querySelector(
        `#${productInfo.uniqueId}-quantity`
      );
      const actualQuantity = quantityInput ? parseInt(quantityInput.value) : 0;

      if (isNaN(actualQuantity) || actualQuantity < 0) {
        console.error(
          "Số lượng không hợp lệ cho sản phẩm:",
          productInfo.MaSanPham
        );
        return;
      }

      const productDetails = {
        MaPhieuKiemKe: sheetId,
        MaSanPham: productInfo.MaSanPham,
        SoLuongThucTe: actualQuantity,
        MaDonVi: productInfo.MaDonVi,
      };

      const detailResponse = await fetch(
        "http://localhost:3000/api/chitietphieukiemke",
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
          `Không thể thêm chi tiết phiếu kiểm kê: ${errorData.message}`
        );
      }
    });

    await Promise.all(productPromises);

    alert("Phiếu kiểm kê đã được tạo thành công.");
    localStorage.removeItem("selectedProducts");
    localStorage.removeItem("sheetDetails");
  } catch (error) {
    console.error("Lỗi khi thêm phiếu kiểm kê:", error);
    alert(error.message);
  } finally {
    isSubmitting = false; // Đặt lại cờ sau khi hoàn thành
  }
}

function cancel() {
  window.history.back();
}
