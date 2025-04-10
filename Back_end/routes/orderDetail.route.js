const { Router } = require("express");
const sql = require("mssql");

const orderDetailRouter = new Router();

// 1. Thêm chi tiết đơn hàng
orderDetailRouter.post("/api/chitietdonhang", async (req, res) => {
  const { MaDonHang, MaSanPham, SoLuong, GiaSanPham, MaDonVi } = req.body;

  if (!MaDonHang || !MaSanPham || !SoLuong || !GiaSanPham || !MaDonVi) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SoLuong <= 0 || GiaSanPham < 0) {
    return res
      .status(400)
      .json({ message: "Số lượng và giá sản phẩm phải lớn hơn 0." });
  }

  try {
    const pool = await sql.connect(req.app.get("dbConfig")); // Lấy config từ app
    const request = new sql.Request(pool);

    request.input("MaDonHang", sql.NVarChar, MaDonHang);
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("GiaSanPham", sql.Decimal, GiaSanPham);
    request.input("MaDonVi", sql.NVarChar, MaDonVi);

    await request.query(
      "INSERT INTO ChiTietDonHang (MaDonHang, MaSanPham, SoLuong, GiaSanPham, MaDonVi) VALUES (@MaDonHang, @MaSanPham, @SoLuong, @GiaSanPham, @MaDonVi)"
    );

    const totalProductValue = SoLuong * GiaSanPham;

    const updateRequest = new sql.Request(pool);
    updateRequest.input("MaDonHang", sql.NVarChar, MaDonHang);
    updateRequest.input("TongGiaTri", sql.Decimal, totalProductValue);

    await updateRequest.query(
      "UPDATE DonHang SET TongGiaTri = ISNULL(TongGiaTri, 0) + @TongGiaTri WHERE MaDonHang = @MaDonHang"
    );

    res
      .status(201)
      .json({ message: "Chi tiết đơn hàng đã được thêm thành công." });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi thêm chi tiết đơn hàng." });
  }
});

// 2. Lấy danh sách chi tiết đơn hàng theo mã đơn hàng
orderDetailRouter.get("/api/chitietdonhang/:maDonHang", async (req, res) => {
  const { maDonHang } = req.params;

  try {
    const pool = await sql.connect(req.app.get("dbConfig"));
    const ps = new sql.PreparedStatement(pool);
    ps.input("maDonHang", sql.NVarChar); // Khai báo tham số

    await ps.prepare(
      "SELECT * FROM ChiTietDonHang WHERE MaDonHang = @maDonHang"
    );
    const result = await ps.execute({ maDonHang });
    await ps.unprepare();

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng." });
  }
});

// 3. Cập nhật chi tiết đơn hàng
orderDetailRouter.put("/api/chitietdonhang/:id", async (req, res) => {
  const { id } = req.params;
  const { SoLuong, GiaSanPham } = req.body;

  try {
    const request = new sql.Request();
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("GiaSanPham", sql.Decimal, GiaSanPham);
    request.input("Id", sql.Int, id); // Đảm bảo có ID

    await request.query(
      "UPDATE ChiTietDonHang SET SoLuong = @SoLuong, GiaSanPham = @GiaSanPham WHERE Id = @Id"
    );

    res.status(200).json({ message: "Chi tiết đơn hàng đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật chi tiết đơn hàng." });
  }
});

// 4. Xóa chi tiết đơn hàng
orderDetailRouter.delete("/api/chitietdonhang/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    request.input("Id", sql.Int, id); // Giả sử Id là kiểu Int

    await request.query("DELETE FROM ChiTietDonHang WHERE Id = @Id");

    res.status(200).json({ message: "Chi tiết đơn hàng đã được xóa." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết đơn hàng." });
  }
});

module.exports = orderDetailRouter;
