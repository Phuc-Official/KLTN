function cancel() {
  // Quay về trang trước
  window.history.back();
}
function viewProductDetails(productId) {
  window.location.href = `../product/productDetail.html?id=${productId}`; // Chuyển hướng đến trang chi tiết
}

async function suggestNextProductId() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/sanpham/max-masanpham"
    );
    const data = await response.json();

    if (data.maxMaSanPham) {
      const prefix = data.maxMaSanPham.slice(0, 2); // Lấy tiền tố (ví dụ: "SP")
      const currentNumber = parseInt(data.maxMaSanPham.slice(2), 10); // Lấy số hiện tại (ví dụ: "0001")

      const nextNumber = (currentNumber + 1).toString().padStart(4, "0"); // Tăng số lên và thêm số 0 phía trước
      const nextProductId = prefix + nextNumber; // Gợi ý mã sản phẩm tiếp theo

      document.getElementById("product-id").value = nextProductId; // Hiển thị mã sản phẩm gợi ý
    } else {
      document.getElementById("product-id").value = "SP0001"; // Giá trị mặc định nếu chưa có sản phẩm nào
    }
  } catch (error) {
    console.error("Lỗi khi gợi ý mã sản phẩm:", error);
  }
}

async function addProduct() {
  const priceInput = document.getElementById("price").value;
  const rawPrice = priceInput.replace(/\./g, ""); // Loại bỏ dấu chấm
  const formattedPrice = parseFloat(rawPrice); // Chuyển đổi thành số

  const product = {
    MaSanPham: document.getElementById("product-id").value,
    TenSanPham: document.getElementById("product-name").value,
    TrongLuong: document.getElementById("weight").value,
    MoTaSanPham: document.getElementById("description").value,
    MaDonVi: document.getElementById("unit").value,
    MaNhom: document.getElementById("product-group").value,
    GiaSanPham: formattedPrice,
  };

  try {
    const response = await fetch("http://localhost:3000/api/sanpham", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm sản phẩm");
    }

    const result = await response.json();
    alert(result.message); // Thông báo thêm sản phẩm thành công

    // Reset form
    document.getElementById("product-form").reset();
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    alert("Lỗi khi thêm sản phẩm!");
  }
}

// async function getProducts(endpoint, containerId) {
//   try {
//     const response = await fetch(`http://localhost:3000/api/${endpoint}`);
//     if (!response.ok) {
//       throw new Error("Mạng lỗi, không thể lấy dữ liệu");
//     }
//     const data = await response.json();
//     const container = document.getElementById(containerId);

//     // Tạo tiêu đề cho bảng
//     const headerRow = document.createElement("tr");
//     headerSanPham.forEach((key) => {
//       const th = document.createElement("th");
//       th.textContent = key;
//       headerRow.appendChild(th);
//     });
//     container.appendChild(headerRow);

//     // Hiển thị dữ liệu
//     const formatted = data.map((item) => ({
//       tenSP: item.TenSanPham,
//       trongLuong: item.TrongLuong,
//       dvTinh: item.DonViTinh,
//       soLuongTon: item.SoLuongTon,
//     }));

//     formatted.forEach((item) => {
//       const row = document.createElement("tr");
//       Object.values(item).forEach((value) => {
//         const td = document.createElement("td");
//         td.textContent = value; // Hiển thị giá trị
//         row.appendChild(td);
//       });
//       container.appendChild(row);
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy dữ liệu:", error);
//   }
// }

async function loadGroups() {
  try {
    const response = await fetch("http://localhost:3000/api/nhomsanpham");
    const groups = await response.json();
    const groupSelect = document.getElementById("product-group");

    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.MaNhom;
      option.textContent = group.TenNhom;
      groupSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi khi tải đơn vị tính:", error);
  }
}

function formatCurrency(value) {
  // Chuyển đổi giá thành chuỗi, loại bỏ các ký tự không phải số, sau đó định dạng
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Thêm dấu chấm
}
function formatPriceInput() {
  const priceInput = document.getElementById("price");
  let value = priceInput.value.replace(/\./g, ""); // Xóa dấu chấm để xử lý
  if (!isNaN(value) && value !== "") {
    priceInput.value = formatCurrency(value); // Định dạng lại giá
  } else {
    priceInput.value = ""; // Nếu không phải số, xóa ô
  }
}

// fetchProducts();
loadGroups();
// Gọi hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  // getProducts("donhang", "donhang-container");
  // getProducts("sanpham", "sanpham-container");
});
// Gọi hàm khi trang được tải
window.onload = suggestNextProductId;

// Hàm thêm sản phẩm
document.getElementById("add-button").addEventListener("click", addProduct);
