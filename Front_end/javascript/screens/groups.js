function cancel() {
  // Quay về trang trước
  window.history.back();
}

function viewGroupDetails(groupId) {
  window.location.href = `../group/groupDetail.html?id=${groupId}`;
}

async function addGroup() {
  const group = {
    TenNhom: document.getElementById("group-name").value,
    MoTa: document.getElementById("description").value,
  };

  try {
    const response = await fetch("http://localhost:3000/api/nhomsanpham", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(group),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm nhóm sản phẩm");
    }

    const result = await response.json();
    alert(result.message); // Thông báo thêm nhóm sản phẩm thành công

    // Reset form
    document.getElementById("group-form").reset();
  } catch (error) {
    console.error("Lỗi khi thêm nhóm sản phẩm:", error);
    alert("Lỗi khi thêm nhóm sản phẩm!");
  }
}

async function fetchGroups() {
  try {
    const response = await fetch("http://localhost:3000/api/nhomsanpham");
    const groups = await response.json();

    const container = document.querySelector("#group-container tbody");
    container.innerHTML = ""; // Xóa nội dung cũ

    groups.forEach((group) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                  <td>${group.TenNhom}</td>
                  <td>${group.MoTa}</td>
            `;
      row.addEventListener("click", () => {
        viewGroupDetails(group.MaNhom);
      });
      container.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi tải nhóm sản phẩm:", error);
  }
}

fetchGroups(); // Gọi hàm khi trang được tải

// Gọi hàm khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  // Có thể thêm mã khởi tạo khác nếu cần
});

// Hàm thêm nhóm sản phẩm
document.getElementById("add-group-button").addEventListener("click", addGroup);
