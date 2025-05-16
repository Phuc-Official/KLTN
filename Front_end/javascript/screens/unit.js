let conversionRate = 1.0; // Giá trị mặc định cho TyleQuyDoi

async function loadUnits() {
  try {
    const response = await fetch(`${BACKEND_URL}/donvitinh`);
    const units = await response.json();
    const unitSelect = document.getElementById("unit");

    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.MaDonVi;
      option.textContent = unit.TenDonVi;
      option.dataset.conversionRate = unit.TyleQuyDoi; // Lưu tỷ lệ quy đổi vào thuộc tính data
      unitSelect.appendChild(option);
    });

    // Thêm sự kiện thay đổi cho ô chọn đơn vị
    unitSelect.addEventListener("change", (event) => {
      const selectedOption = event.target.options[event.target.selectedIndex];
      conversionRate = selectedOption.dataset.conversionRate || 1.0; // Lấy tỷ lệ quy đổi
      document.getElementById("conversion-rate").value = conversionRate; // Hiển thị tỷ lệ quy đổi
      updateQuantity(); // Cập nhật số lượng tồn
    });
  } catch (error) {
    console.error("Lỗi khi tải đơn vị tính:", error);
  }
}

function updateQuantity() {
  const convertedStockQuantity =
    parseFloat(document.getElementById("converted-stock-quantity").value) || 0;
  const totalQuantity = convertedStockQuantity * conversionRate; // Tính số lượng tồn
  document.getElementById("quantity").value = totalQuantity; // Hiển thị số lượng tồn
}

// Gọi hàm tải đơn vị tính khi trang được tải
loadUnits();
