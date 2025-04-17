async function loadWarehousePositions() {
  try {
    const response = await fetch("http://localhost:3000/api/vitri");
    if (!response.ok) throw new Error("Không thể lấy dữ liệu");

    const positions = await response.json();
    const warehouseDiv = document.getElementById("warehouse");
    warehouseDiv.innerHTML = ""; // Xóa nội dung cũ

    // Nhóm dữ liệu theo dãy
    const groupedPositions = {};
    positions.forEach((position) => {
      const key = position.Day; // Nhóm theo dãy
      if (!groupedPositions[key]) {
        groupedPositions[key] = [];
      }
      groupedPositions[key].push(position);
    });

    // Hiển thị dữ liệu
    const keys = Object.keys(groupedPositions);

    for (let i = 0; i < keys.length; i++) {
      const columnDiv = document.createElement("div");
      columnDiv.className = "column";

      // Hiển thị kệ từ 9 đến 1
      for (let j = 9; j >= 1; j--) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";

        // Đặt màu sắc cho ô dựa vào tỷ lệ phần trăm
        const position = groupedPositions[keys[i]].find((pos) => pos.Ke === j);
        const quantity = position ? position.Quantity : 0; // Số lượng sản phẩm
        const capacity = 288; // Sức chứa mỗi ô
        const percentage = (quantity / capacity) * 100; // Tính tỷ lệ phần trăm

        // Đặt màu sắc cho ô dựa vào tỷ lệ phần trăm
        if (percentage === 0) {
          cellDiv.style.backgroundColor = "#c3e6cb"; // Trống
        } else if (percentage > 0 && percentage <= 50) {
          cellDiv.style.backgroundColor = "#fff3cd"; // Còn chỗ
        } else if (percentage > 50 && percentage < 100) {
          cellDiv.style.backgroundColor = "#ff9900"; // Gần đầy
        } else {
          cellDiv.style.backgroundColor = "#ff0000"; // Đầy
        }

        cellDiv.textContent = j; // Hiển thị số kệ từ 1 đến 9
        columnDiv.appendChild(cellDiv);
      }

      // Thêm ký tự dãy vào dưới cùng
      const labelDiv = document.createElement("div");
      labelDiv.className = "label";
      labelDiv.textContent = keys[i]; // Ký tự dãy
      columnDiv.appendChild(labelDiv);

      warehouseDiv.appendChild(columnDiv); // Thêm cột vào kho

      // Thêm khoảng cách giữa mỗi 2 dãy
      if (i % 2 === 1) {
        const spacerDiv = document.createElement("div");
        spacerDiv.className = "spacer"; // Tạo khoảng cách
        warehouseDiv.appendChild(spacerDiv);
      }
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadWarehousePositions);
