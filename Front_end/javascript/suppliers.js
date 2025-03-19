function cancel() {
  // Quay về trang trước
  window.history.back();
}
function viewSupplierDetails(supplierId) {
  window.location.href = `../supplier/supplierDetails.html?id=${supplierId}`;
}

async function addSupplier() {
  const supplier = {
    MaNhaCungCap: document.getElementById("supplier-id").value,
    TenNhaCungCap: document.getElementById("supplier-name").value,
    SoDienThoai: document.getElementById("phone").value,
    Email: document.getElementById("email").value,
    MaSoThue: document.getElementById("tax-id").value,
    // DiaChi: document.getElementById("address").value,
  };

  try {
    const response = await fetch("http://localhost:3000/api/nha-cung-cap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supplier),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm nhà cung cấp");
    }

    const result = await response.json();
    alert(result.message); // Thông báo thêm nhà cung cấp thành công

    // Reset form
    document.getElementById("supplier-form").reset();
    document.getElementById("address-form").reset();
  } catch (error) {
    console.error("Lỗi khi thêm nhà cung cấp:", error);
    alert("Lỗi khi thêm nhà cung cấp!");
  }
}

async function fetchSuppliers() {
  try {
    const response = await fetch("http://localhost:3000/api/nha-cung-cap");
    const suppliers = await response.json();

    const container = document.querySelector("#supplier-container tbody");
    container.innerHTML = ""; // Xóa nội dung cũ

    suppliers.forEach((supplier) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${supplier.MaNhaCungCap}</td>
                <td>${supplier.TenNhaCungCap}</td>
                <td>${supplier.SoDienThoai}</td>
                <td>${supplier.Email}</td>
          `;
      row.addEventListener("click", () => {
        viewSupplierDetails(supplier.MaNhaCungCap);
      });
      container.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi tải nhà cung cấp:", error);
  }
}

fetchSuppliers(); // Gọi hàm khi trang được tải

// Gọi hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  // getProducts("donhang", "donhang-container");
  // getProducts("sanpham", "sanpham-container");
});

// Hàm thêm sản phẩm
document
  .getElementById("add-supplier-button")
  .addEventListener("click", addSupplier);
