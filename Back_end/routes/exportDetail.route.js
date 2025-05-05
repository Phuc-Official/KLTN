const { Router } = require("express");
const sql = require("mssql");

const exportDetailRouter = new Router();

// 1. Thêm chi tiết phiếu xuất
exportDetailRouter.post("/api/chitietphieuxuat", async (req, res) => {
  const { MaPhieuXuat, MaSanPham, SoLuong, MaDonViKhac } = req.body;

  if (!MaPhieuXuat || !MaSanPham || !SoLuong || !MaDonViKhac) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SoLuong <= 0) {
    return res.status(400).json({ message: "Số lượng phải lớn hơn 0." });
  }

  try {
    const pool = await sql.connect(req.app.get("dbConfig"));

    // Kiểm tra số lượng tồn kho trước khi xuất
    const checkStockRequest = new sql.Request(pool);
    checkStockRequest.input("MaDonViKhac", sql.Int, MaDonViKhac);
    const stockResult = await checkStockRequest.query(
      "SELECT SoLuongTon FROM DonViKhac WHERE ID = @MaDonViKhac"
    );

    if (stockResult.recordset.length === 0) {
      return res.status(400).json({ message: "Đơn vị tính không tồn tại." });
    }

    const currentStock = stockResult.recordset[0].SoLuongTon;
    if (currentStock < SoLuong) {
      return res.status(400).json({
        message: `Số lượng tồn kho không đủ. Hiện có: ${currentStock}`,
      });
    }

    // Thêm chi tiết phiếu xuất
    const request = new sql.Request(pool);
    request.input("MaPhieuXuat", sql.NVarChar, MaPhieuXuat);
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("MaDonViKhac", sql.Int, MaDonViKhac);

    await request.query(
      "INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaSanPham, SoLuong, MaDonViKhac) VALUES (@MaPhieuXuat, @MaSanPham, @SoLuong, @MaDonViKhac)"
    );

    // Cập nhật số lượng tồn kho trong bảng DonViKhac
    const stockUpdateRequest = new sql.Request(pool);
    stockUpdateRequest.input("MaSanPham", sql.NVarChar, MaSanPham);
    stockUpdateRequest.input("SoLuong", sql.Int, SoLuong);
    stockUpdateRequest.input("MaDonViKhac", sql.Int, MaDonViKhac);

    await stockUpdateRequest.query(
      "UPDATE DonViKhac SET SoLuongTon = ISNULL(SoLuongTon, 0) - @SoLuong WHERE ID = @MaDonViKhac"
    );

    res
      .status(201)
      .json({ message: "Chi tiết phiếu xuất đã được thêm thành công." });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết phiếu xuất:", error);
    res.status(500).json({ message: "Lỗi khi thêm chi tiết phiếu xuất." });
  }
});

// 2. Lấy danh sách chi tiết phiếu xuất theo mã phiếu xuất
exportDetailRouter.get(
  "/api/chitietphieuxuat/:maPhieuXuat",
  async (req, res) => {
    const { maPhieuXuat } = req.params;

    try {
      const pool = await sql.connect(req.app.get("dbConfig"));
      const ps = new sql.PreparedStatement(pool);
      ps.input("maPhieuXuat", sql.NVarChar); // Khai báo tham số

      await ps.prepare(
        "SELECT * FROM ChiTietPhieuXuat WHERE MaPhieuXuat = @maPhieuXuat"
      );
      const result = await ps.execute({ maPhieuXuat });
      await ps.unprepare();

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu xuất." });
    }
  }
);

// 3. Cập nhật chi tiết phiếu xuất
exportDetailRouter.put("/api/chitietphieuxuat/:id", async (req, res) => {
  const { id } = req.params;
  const { SoLuong, GiaSanPham } = req.body;

  try {
    const request = new sql.Request();
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("GiaSanPham", sql.Decimal, GiaSanPham);
    request.input("Id", sql.Int, id); // Thêm Id vào tham số

    await request.query(
      "UPDATE ChiTietPhieuXuat SET SoLuong = @SoLuong, GiaSanPham = @GiaSanPham WHERE Id = @Id"
    );

    res.status(200).json({ message: "Chi tiết phiếu xuất đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật chi tiết phiếu xuất." });
  }
});

// 4. Xóa chi tiết phiếu xuất
exportDetailRouter.delete("/api/chitietphieuxuat/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    request.input("Id", sql.Int, id); // Giả sử Id là kiểu Int

    await request.query("DELETE FROM ChiTietPhieuXuat WHERE Id = @Id");

    res.status(200).json({ message: "Chi tiết phiếu xuất đã được xóa." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết phiếu xuất." });
  }
});

module.exports = exportDetailRouter;
