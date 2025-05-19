async function loadDashboardData() {
  try {
    const [receiptsRes, exportsRes, ordersRes] = await Promise.all([
      fetch(`${BACKEND_URL}/phieunhap`),
      fetch(`${BACKEND_URL}/phieuxuat`),
      fetch(`${BACKEND_URL}/donhang`),
    ]);

    if (!receiptsRes.ok || !exportsRes.ok || !ordersRes.ok) {
      throw new Error("Không thể tải dữ liệu từ server");
    }

    const receipts = await receiptsRes.json();
    const exportsData = await exportsRes.json();
    const orders = await ordersRes.json();

    // Tổng đơn hàng
    const totalOrders = orders.length;

    // Đơn hàng chờ xử lý
    const pendingOrders = orders.filter(
      (o) =>
        o.TrangThai.toLowerCase() === "chờ xử lý" ||
        o.TrangThai.toLowerCase() === "dang cho xu ly"
    ).length;

    document.getElementById("total-receipts").textContent = receipts.length;
    document.getElementById("total-exports").textContent = exportsData.length;
    document.getElementById("total-orders").textContent = totalOrders;
    document.getElementById("pending-orders").textContent = pendingOrders;
  } catch (error) {
    console.error("Lỗi khi tải dashboard:", error);
    alert("Lỗi khi tải dữ liệu dashboard. Vui lòng thử lại sau.");
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardData);
