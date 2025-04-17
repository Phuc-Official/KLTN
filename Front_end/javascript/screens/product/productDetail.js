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
      product.SoLuongTon ? product.SoLuongTon : 0;

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

    // Cập nhật bảng đơn vị tính
    // await updateConversionTable(product.SoLuongTon); // Gọi hàm để cập nhật bảng
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    document.getElementById("product-details").innerHTML =
      "<p>Không thể tải chi tiết sản phẩm.</p>";
  }
}

async function updateConversionTable(originalStock) {
  const conversionBody = document.getElementById("conversion-body");
  conversionBody.innerHTML = ""; // Xóa nội dung cũ

  // Tạo một mảng chứa thông tin đơn vị và tỷ lệ quy đổi
  const conversionData = await Promise.all(
    unitOfMeasurements.map(async (unit) => {
      const conversionRate = await getConversionRate(unit.MaDonVi);
      const convertedStock = Math.floor(originalStock / conversionRate); // Tính số lượng tồn quy đổi
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
    const response = await fetch(
      `http://localhost:3000/api/donvitinh/${unitId}`
    );
    if (!response.ok) {
      throw new Error(`Không thể lấy tỷ lệ quy đổi cho mã đơn vị: ${unitId}`);
    }
    const data = await response.json();

    // Kiểm tra xem có tỷ lệ quy đổi không
    if (data.conversionRate === undefined) {
      throw new Error(
        `Tỷ lệ quy đổi không được xác định cho mã đơn vị: ${unitId}`
      );
    }

    return data.conversionRate; // Trả về tỷ lệ quy đổi
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    return 1; // Trả về 1 nếu có lỗi
  }
}
