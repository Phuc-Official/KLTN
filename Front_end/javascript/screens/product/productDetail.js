let unitOfMeasurements = []; // Khởi tạo biến toàn cục

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

async function fetchProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const maSanPham = urlParams.get("id");

  try {
    const response = await fetch(
      `http://localhost:3000/api/sanpham/${maSanPham}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi từ server:", errorText);
      throw new Error("Không thể tải chi tiết sản phẩm.");
    }

    const product = await response.json(); // Phân tích cú pháp JSON

    // Cập nhật các phần tử HTML
    document.getElementById("product-name").innerText = product.TenSanPham;
    document.getElementById("product-id").value = product.MaSanPham;
    document.getElementById("type").value = product.TenNhom;
    document.getElementById("weight").value = product.TrongLuong;
    document.getElementById("description").value = product.MoTaSanPham;
    document.getElementById("converted-stock-quantity").value =
      product.SoLuongTon;

    // Thêm các đơn vị tính vào dropdown
    const unitSelect = document.getElementById("unit");
    unitOfMeasurements.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.MaDonVi;
      option.textContent = unit.TenDonVi;
      if (unit.MaDonVi === product.MaDonVi) {
        option.selected = true;
      }
      unitSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    document.getElementById("product-details").innerHTML =
      "<p>Không thể tải chi tiết sản phẩm.</p>";
  }
}

// Gọi hàm để tải danh sách đơn vị tính trước khi tải chi tiết sản phẩm
fetchUnitOfMeasurements().then(() => {
  fetchProductDetails(); // Gọi hàm khi đã tải xong danh sách đơn vị tính
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

    conversionRateInput.value = conversionRate > 0 ? conversionRate : ""; // Cập nhật tỷ lệ quy đổi

    // Lấy số lượng tồn và đảm bảo nó là một số nguyên
    const originalStockValue = document.getElementById(
      "converted-stock-quantity"
    ).value;
    const originalStock = parseInt(originalStockValue, 10);

    if (isNaN(originalStock) || originalStock < 0) {
      convertedStockInput.value = ""; // Đặt lại giá trị về chuỗi rỗng
      return;
    }

    // Tính số lượng tồn quy đổi
    let convertedStock = originalStock / conversionRate;
    convertedStock = Math.floor(convertedStock); // Làm tròn xuống

    convertedStockInput.value = convertedStock; // Cập nhật số lượng tồn quy đổi
  });
}

async function getConversionRate(unitId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/donvitinh/${unitId}`
    );
    if (!response.ok) {
      throw new Error(`Không thể lấy tỷ lệ quy đổi cho mã đơn vị: ${unitId}`);
    }
    const data = await response.json();
    return data.conversionRate; // Giả định rằng API trả về tỷ lệ quy đổi
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    return 1; // Trả về 1 nếu có lỗi
  }
}
