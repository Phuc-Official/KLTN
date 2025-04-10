let selectedProductIds = new Set();
let productSelectCount = {};
let unitOfMeasurements = []; // Biến toàn cục để lưu danh sách đơn vị tính
const today = new Date().toISOString().split("T")[0];

// Hàm quay về trang trước
function cancel() {
  window.history.back();
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

async function addReceipt() {
  const receipt = getReceiptDetailsFromForm();

  if (!receipt) {
    alert("Vui lòng điền đầy đủ thông tin phiếu nhập.");
    return;
  }

  try {
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

    // Cập nhật chi tiết phiếu nhập cho từng sản phẩm
    const productPromises = selectedProducts.map(async (productInfo) => {
      const productDetails = {
        MaPhieuNhap: receiptId,
        MaSanPham: productInfo.MaSanPham,
        SoLuong: productInfo.quantity,
        GiaSanPham: productInfo.price,
        MaDonVi: productInfo.MaDonVi,
      };

      // Log chi tiết sản phẩm trước khi thêm
      console.log("Thêm chi tiết phiếu nhập cho sản phẩm:", productDetails);

      // Gửi yêu cầu thêm chi tiết phiếu nhập
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
    });

    await Promise.all(productPromises);
    alert("Phiếu nhập và sản phẩm đã được thêm thành công.");
    document.getElementById("receipt-form").reset();
    selectedProducts = [];
    updateSelectedProducts();
  } catch (error) {
    console.error("Lỗi khi thêm phiếu nhập:", error);
    alert(error.message);
  }
}

// Khởi tạo các hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  fetchUnitOfMeasurements();
  suggestNextReceiptId(); // Gợi ý mã phiếu nhập khi trang tải

  // Gọi hàm khi thêm phiếu nhập
  //   document.getElementById("add-button").addEventListener("click", addReceipt);
});

document.getElementById("date-create").value = today;
