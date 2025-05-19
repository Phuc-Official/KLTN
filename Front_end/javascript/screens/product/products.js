function cancel() {
  // Quay về trang trước
  window.history.back();
}

async function suggestNextProductId() {
  try {
    const response = await fetch(`${BACKEND_URL}/sanpham/max-masanpham`);
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

let additionalUnits = []; // Mảng để lưu trữ các đơn vị quy đổi

// Xử lý sự kiện cho tiêu đề phần đơn vị
document.getElementById("unit-title").addEventListener("click", () => {
  const unitsContent = document.getElementById("units-content");
  const toggleArrow = document.getElementById("toggle-arrow");

  unitsContent.style.display =
    unitsContent.style.display === "none" ? "block" : "none";
  toggleArrow.classList.toggle("fa-chevron-down");
  toggleArrow.classList.toggle("fa-chevron-up");
});

// Thêm đơn vị
document.getElementById("add-unit").addEventListener("click", (event) => {
  event.preventDefault(); // Ngăn chặn gửi form
  addAdditionalUnit(); // Gọi hàm để thêm đơn vị
});

// Thêm sản phẩm
async function addProduct() {
  const productId = document.getElementById("product-id").value;
  const productName = document.getElementById("product-name").value;
  const weight = document.getElementById("weight").value;
  const description = document.getElementById("description").value;
  const groupId = document.getElementById("product-group").value; // Nhóm sản phẩm
  const baseUnit = document.getElementById("base-unit").value; // Đơn vị cơ bản

  // Lấy thông tin các đơn vị bổ sung
  const additionalUnits = Array.from(
    document.querySelectorAll("#additional-units > div")
  ).map((unitRow) => {
    const unitName = unitRow.querySelector("input[type='text']")?.value; // Tên đơn vị
    const conversionRate =
      parseFloat(unitRow.querySelector("input[type='number']")?.value) || 1; // Tỷ lệ quy đổi

    console.log("Đơn vị:", unitName);
    console.log("Tỷ lệ quy đổi:", conversionRate);

    if (!unitName) {
      throw new Error("Tên đơn vị không hợp lệ");
    }

    return {
      TenDonVi: unitName,
      TyLeQuyDoi: conversionRate,
    };
  });

  // Kiểm tra tất cả các trường cần thiết
  if (!productId || !productName || !weight || !groupId || !baseUnit) {
    alert("Vui lòng điền đầy đủ thông tin sản phẩm.");
    return;
  }

  try {
    // Thêm sản phẩm vào cơ sở dữ liệu
    const response = await fetch(`${BACKEND_URL}/sanpham`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        MaSanPham: productId,
        TenSanPham: productName,
        TrongLuong: weight,
        MoTaSanPham: description,
        MaNhom: groupId,
      }),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm sản phẩm");
    }

    // Lưu đơn vị cơ bản vào bảng DonViKhac
    await fetch(`${BACKEND_URL}/donvitinhkhac`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        MaSanPham: productId,
        TenDonVi: baseUnit,
        TyLeQuyDoi: 1, // Tỷ lệ quy đổi mặc định
        SoLuongTon: 0,
      }),
    });

    // Thêm các đơn vị bổ sung vào DonViKhac
    for (const unit of additionalUnits) {
      const unitData = {
        MaSanPham: productId,
        TenDonVi: unit.TenDonVi,
        TyLeQuyDoi: unit.TyLeQuyDoi,
        SoLuongTon: 0,
      };

      const additionalUnitResponse = await fetch(
        `${BACKEND_URL}/donvitinhkhac`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(unitData),
        }
      );

      if (!additionalUnitResponse.ok) {
        console.error(
          "Lỗi khi thêm đơn vị bổ sung:",
          await additionalUnitResponse.text()
        );
      }
    }

    alert("Sản phẩm đã được thêm thành công!");

    // Reset form
    document.getElementById("product-form").reset();
    document.getElementById("additional-units").innerHTML = ""; // Xóa các đơn vị quy đổi
    window.location.href = "productList.html";
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    alert("Lỗi khi thêm sản phẩm!");
  }
}

// Tải nhóm sản phẩm
async function loadGroups() {
  try {
    const response = await fetch(`${BACKEND_URL}/nhomsanpham`);
    const groups = await response.json();
    const groupSelect = document.getElementById("product-group");

    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.MaNhom;
      option.textContent = group.TenNhom;
      groupSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi khi tải nhóm sản phẩm:", error);
  }
}

function addAdditionalUnit() {
  const additionalUnitContainer = document.createElement("div");
  additionalUnitContainer.style.margin = "0px";

  const unitRow = document.createElement("div");
  unitRow.style.display = "flex";

  const unitNameInput = document.createElement("input");
  unitNameInput.type = "text";
  unitNameInput.placeholder = "Nhập tên đơn vị";
  unitNameInput.style.marginRight = "10px";
  unitNameInput.style.marginBottom = "10px";

  const conversionRateInput = document.createElement("input");
  conversionRateInput.type = "number";
  conversionRateInput.placeholder = "Tỷ lệ quy đổi";
  conversionRateInput.style.marginRight = "10px";
  conversionRateInput.style.marginBottom = "10px";

  const removeButton = document.createElement("button");
  removeButton.textContent = "Xóa";
  removeButton.style.marginBottom = "10px";
  removeButton.addEventListener("click", () => {
    additionalUnitContainer.remove();
  });

  unitRow.appendChild(unitNameInput);
  unitRow.appendChild(conversionRateInput);
  unitRow.appendChild(removeButton);
  additionalUnitContainer.appendChild(unitRow);

  document
    .getElementById("additional-units")
    .appendChild(additionalUnitContainer);
}

function removeUnit(button) {
  button.parentElement.remove();
}

// Định dạng giá
function formatCurrency(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Thêm dấu chấm
}

// Định dạng lại ô nhập giá
function formatPriceInput() {
  const priceInput = document.getElementById("price");
  let value = priceInput.value.replace(/\./g, ""); // Xóa dấu chấm để xử lý
  if (!isNaN(value) && value !== "") {
    priceInput.value = formatCurrency(value); // Định dạng lại giá
  } else {
    priceInput.value = ""; // Nếu không phải số, xóa ô
  }
}

function filterProducts() {
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const limitValue = parseInt(document.getElementById("limitInput").value);

  const rows = document.querySelectorAll("#productTable tbody tr"); // Giả sử bảng có id="productTable"

  rows.forEach((row) => {
    const maSP = row.querySelector(".ma-sp")?.textContent.toLowerCase() || "";
    const tenSP = row.querySelector(".ten-sp")?.textContent.toLowerCase() || "";
    const soLuongTon =
      parseInt(row.querySelector(".so-luong-ton")?.textContent) || 0;

    const matchSearch =
      maSP.includes(searchValue) || tenSP.includes(searchValue);
    const matchLimit = isNaN(limitValue) || soLuongTon <= limitValue;

    if (matchSearch && matchLimit) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Gọi hàm khi trang được tải
window.onload = () => {
  suggestNextProductId();
  loadGroups();
};

// Gọi hàm khi nhấn nút thêm sản phẩm
document.getElementById("add-button").addEventListener("click", addProduct);
