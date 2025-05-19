let isShelfInfoVisible = false; // Biến để theo dõi trạng thái hiện tại của drawer

async function loadWarehousePositions() {
  try {
    const response = await fetch(`${BACKEND_URL}/vitri`);
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

    const keys = Object.keys(groupedPositions);
    for (let i = 0; i < keys.length; i++) {
      const columnDiv = document.createElement("div");
      columnDiv.className = "column";

      // Hiển thị các kệ
      for (let j = 9; j >= 1; j--) {
        const positionsInShelf = groupedPositions[keys[i]].filter(
          (pos) => pos.Ke === j
        );
        const totalQuantity = positionsInShelf.reduce(
          (sum, pos) => sum + pos.SoLuong,
          0
        );
        const averagePercentage =
          (totalQuantity / (positionsInShelf.length * 288)) * 100;

        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";
        cellDiv.textContent = j; // Hiển thị số kệ từ 1 đến 9
        cellDiv.style.backgroundColor = getBackgroundColor(averagePercentage);

        // Thêm sự kiện click để mở thông tin kệ
        cellDiv.addEventListener("click", () => {
          showShelfPositions(groupedPositions[keys[i]], keys[i]);
        });

        columnDiv.appendChild(cellDiv);
      }

      const labelDiv = document.createElement("div");
      labelDiv.className = "label";
      labelDiv.textContent = keys[i]; // Ký tự dãy
      columnDiv.appendChild(labelDiv);

      warehouseDiv.appendChild(columnDiv);

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

function getBackgroundColor(percentage) {
  if (percentage === 0) return "#c3e6cb"; // Trống
  if (percentage > 0 && percentage <= 50) return "#fff3cd"; // Còn chỗ
  if (percentage > 50 && percentage < 100) return "#ff9900"; // Gần đầy
  return "#ff0000"; // Đầy
}

function closeAllDrawers() {
  const drawer = document.getElementById("drawer");
  drawer.classList.remove("open"); // Đóng drawer
  isShelfInfoVisible = false; // Đặt lại trạng thái
}

function showShelfPositions(positions, shelfRowNumber) {
  const drawer = document.getElementById("drawer");
  const drawerTitle = document.getElementById("drawer-title");
  const drawerShelves = document.getElementById("drawer-shelves");
  const infoDisplay = document.getElementById("info-display");
  const createStorageDiv = document.getElementById("create-storage");
  const shelfInfoDiv = document.getElementById("shelf-info");

  createStorageDiv.style.display = "none"; // Ẩn phần
  shelfInfoDiv.style.display = "block"; // Hiển thị phần thông tin kệ
  isShelfInfoVisible = true; // Đặt trạng thái thành true

  drawerTitle.textContent = `Thông tin kệ - Dãy ${shelfRowNumber}`;
  drawerShelves.innerHTML = ""; // Xóa nội dung cũ
  infoDisplay.innerHTML = ""; // Xóa thông tin cũ

  // Tạo hàng cho các kệ

  const shelfRow = document.createElement("div");
  shelfRow.className = "shelf-row";

  for (let j = 1; j <= 9; j++) {
    const shelfColumn = document.createElement("div");
    shelfColumn.className = "shelf-column";

    for (let k = 4; k >= 1; k--) {
      const position = positions.find(
        (pos) => pos.Ke === j && pos.O === k && pos.Day === shelfRowNumber
      );
      const cellDiv = document.createElement("div");
      cellDiv.className = "shelf-cell";
      const quantity = position ? position.SoLuong : 0;
      const capacity = 288;
      const percentage = (quantity / capacity) * 100;

      cellDiv.style.backgroundColor = getBackgroundColor(percentage);
      cellDiv.textContent = `O${k}`;

      cellDiv.addEventListener("click", () => {
        const displayQuantity = quantity || 0;
        if (position) {
          infoDisplay.innerHTML = `Mã vị trí: ${position.MaViTri}, Mã sản phẩm: ${position.MaSanPham} <br> Sức chứa: ${position.SucChua},  Đang chứa: ${displayQuantity}`;
        } else {
          infoDisplay.innerHTML = `Mã: Không có thông tin, Số lượng: 0`;
        }
      });

      shelfColumn.appendChild(cellDiv);
    }

    const labelDiv = document.createElement("div");
    labelDiv.className = "shelf-label";
    labelDiv.textContent = `${j}`;
    shelfColumn.appendChild(labelDiv);
    shelfRow.appendChild(shelfColumn);
  }

  drawerShelves.appendChild(shelfRow);
  drawer.classList.add("open"); // Mở drawer
}

function toggleDrawer() {
  const drawer = document.getElementById("drawer");
  if (drawer.classList.contains("open")) {
    drawer.classList.remove("open");
    isShelfInfoVisible = false; // Đặt lại trạng thái khi đóng
  } else {
    closeAllDrawers();
    drawer.classList.add("open");
    // if (isShelfInfoVisible) {
    //   showShelfInfo(); // Hiển thị thông tin nếu cần
    // }
  }
}

async function createStorage() {
  const day = document.getElementById("day").value;
  const ke = document.getElementById("ke").value;
  const o = parseInt(document.getElementById("o").value);
  const sucChua = parseInt(document.getElementById("suc_chua").value);
  const maSanPham = document.getElementById("ma_san_pham").value;

  const maViTri = `${day}-${ke}-${o}`;

  try {
    // Gửi request tạo hoặc cập nhật vị trí
    const response = await fetch(`${BACKEND_URL}/themvitri`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Day: day,
        Ke: ke,
        O: o,
        SucChua: sucChua,
        MaSanPham: maSanPham,
      }),
    });

    // Nếu có lỗi từ backend
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text();
        throw new Error(`Không thể cập nhật vị trí: ${errorText}`);
      }

      // Nếu vị trí đã có sản phẩm khác
      if (errorData.exists) {
        const confirmUpdate = await showConfirmModal(
          `Vị trí ${maViTri} đã có sản phẩm khác (${errorData.currentProduct}). Bạn có muốn cập nhật không?`
        );
        if (!confirmUpdate) return;

        // Gửi lại yêu cầu với cờ update = true
        const updateResponse = await fetch(`${BACKEND_URL}/themvitri`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Day: day,
            Ke: ke,
            O: o,
            SucChua: sucChua,
            MaSanPham: maSanPham,
            update: true,
          }),
        });

        if (!updateResponse.ok) {
          const errText = await updateResponse.text();
          throw new Error(`Cập nhật thất bại: ${errText}`);
        }

        const updateData = await updateResponse.json();
        alert(updateData.message);
        closeAllDrawers();
        loadWarehousePositions();
        return;
      } else {
        throw new Error(
          `Không thể cập nhật vị trí: ${
            errorData.message || "Lỗi không xác định"
          }`
        );
      }
    }

    // Nếu không có lỗi => cập nhật thành công
    const data = await response.json();
    alert(data.message);
    closeAllDrawers();
    loadWarehousePositions();
  } catch (error) {
    console.error("Lỗi:", error);
    alert(error.message);
  }
}

function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const btnYes = document.getElementById("btnYes");
    const btnNo = document.getElementById("btnNo");

    msg.textContent = message;
    modal.style.display = "flex";

    function cleanUp() {
      btnYes.removeEventListener("click", onYes);
      btnNo.removeEventListener("click", onNo);
      modal.style.display = "none";
    }

    function onYes() {
      cleanUp();
      resolve(true);
    }

    function onNo() {
      cleanUp();
      resolve(false);
    }

    btnYes.addEventListener("click", onYes);
    btnNo.addEventListener("click", onNo);
  });
}

// Đóng drawer khi nhấn vào nút đóng
document
  .getElementById("close-drawer")
  .addEventListener("click", closeAllDrawers);

document
  .getElementById("close-drawer-a")
  .addEventListener("click", closeAllDrawers);

// Gọi loadWarehousePositions khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", loadWarehousePositions);
