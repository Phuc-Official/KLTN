const { Router } = require("express");
const sql = require("mssql");

const exportDetailRouter = new Router();

// 1. Thêm chi tiết phiếu xuất
exportDetailRouter.post("/api/chitietphieuxuat", async (req, res) => {
  const { MaPhieuXuat, MaSanPham, SoLuong, GiaSanPham, MaDonVi } = req.body;

  if (!MaPhieuXuat || !MaSanPham || !SoLuong || !GiaSanPham || !MaDonVi) {
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

    request.input("MaPhieuXuat", sql.NVarChar, MaPhieuXuat);
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("GiaSanPham", sql.Decimal, GiaSanPham);
    request.input("MaDonVi", sql.NVarChar, MaDonVi);

    await request.query(
      "INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaSanPham, SoLuong, GiaSanPham, MaDonVi) VALUES (@MaPhieuXuat, @MaSanPham, @SoLuong, @GiaSanPham, @MaDonVi)"
    );

    const totalProductValue = SoLuong * GiaSanPham;

    const updateRequest = new sql.Request(pool);
    updateRequest.input("MaPhieuXuat", sql.NVarChar, MaPhieuXuat);
    updateRequest.input("TongGiaTri", sql.Decimal, totalProductValue);

    await updateRequest.query(
      "UPDATE PhieuXuat SET TongGiaTri = ISNULL(TongGiaTri, 0) + @TongGiaTri WHERE MaPhieuXuat = @MaPhieuXuat"
    );

    // Gọi API lấy tỷ lệ quy đổi
    const conversionRateResponse = await fetch();
    `http://localhost:3000/api/donvitinh/${MaDonVi}`;
    const conversionRateData = await conversionRateResponse.json();
    const conversionRate = conversionRateData.conversionRate; // Lấy tỷ lệ quy đổi

    const actualStockChange = SoLuong * conversionRate;

    const stockUpdateRequest = new sql.Request(pool);
    stockUpdateRequest.input("MaSanPham", sql.NVarChar, MaSanPham);
    stockUpdateRequest.input("SoLuong", sql.Int, actualStockChange);

    await stockUpdateRequest.query(
      "UPDATE SanPham SET SoLuongTon = ISNULL(SoLuongTon, 0) - @SoLuong WHERE MaSanPham = @MaSanPham"
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
