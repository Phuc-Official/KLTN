const { Router } = require("express");
const sql = require("mssql");

const receiptDetailRouter = new Router();

// 1. Thêm chi tiết phiếu nhập
receiptDetailRouter.post("/api/chitietphieunhap", async (req, res) => {
  const { MaPhieuNhap, MaSanPham, SoLuong, MaDonVi } = req.body;

  if (!MaPhieuNhap || !MaSanPham || !SoLuong || !MaDonVi) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SoLuong <= 0) {
    return res.status(400).json({ message: "Số lượng phải lớn hơn 0." });
  }

  try {
    const pool = await sql.connect(req.app.get("dbConfig")); // Lấy config từ app
    const request = new sql.Request(pool);

    request.input("MaPhieuNhap", sql.NVarChar, MaPhieuNhap);
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("SoLuong", sql.Int, SoLuong);
    // request.input("GiaSanPham", sql.Decimal, GiaSanPham);
    request.input("MaDonVi", sql.NVarChar, MaDonVi);

    await request.query(
      "INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaSanPham, SoLuong, MaDonVi) VALUES (@MaPhieuNhap, @MaSanPham, @SoLuong, @MaDonVi)"
    );

    // const totalProductValue = SoLuong * GiaSanPham;

    const updateRequest = new sql.Request(pool);
    updateRequest.input("MaPhieuNhap", sql.NVarChar, MaPhieuNhap);
    // updateRequest.input("TongGiaTri", sql.Decimal, totalProductValue);

    // await updateRequest.query(
    //   "UPDATE PhieuNhap_Copy SET TongGiaTri = ISNULL(TongGiaTri, 0) + @TongGiaTri WHERE MaPhieuNhap = @MaPhieuNhap"
    // );

    // Gọi API lấy tỷ lệ quy đổi
    const conversionRateResponse = await fetch(
      `http://localhost:3000/api/donvitinh/${MaDonVi}`
    );
    const conversionRateData = await conversionRateResponse.json();
    const conversionRate = conversionRateData.conversionRate; // Lấy tỷ lệ quy đổi

    const actualStockChange = SoLuong * conversionRate;

    const stockUpdateRequest = new sql.Request(pool);
    stockUpdateRequest.input("MaSanPham", sql.NVarChar, MaSanPham);
    stockUpdateRequest.input("SoLuong", sql.Int, actualStockChange);

    await stockUpdateRequest.query(
      "UPDATE SanPham SET SoLuongTon = ISNULL(SoLuongTon, 0) + @SoLuong WHERE MaSanPham = @MaSanPham"
    );

    res
      .status(201)
      .json({ message: "Chi tiết phiếu nhập đã được thêm thành công." });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết phiếu nhập:", error);
    res.status(500).json({ message: "Lỗi khi thêm chi tiết phiếu nhập." });
  }
});

// 2. Lấy danh sách chi tiết phiếu nhập theo mã phiếu nhập
receiptDetailRouter.get(
  "/api/chitietphieunhap/:maPhieuNhap",
  async (req, res) => {
    const { maPhieuNhap } = req.params;

    try {
      const pool = await sql.connect(/* cấu hình của bạn */);
      const ps = new sql.PreparedStatement(pool);
      ps.input("maPhieuNhap", sql.NVarChar); // Khai báo tham số

      await ps.prepare(
        "SELECT * FROM ChiTietPhieuNhap WHERE MaPhieuNhap = @maPhieuNhap"
      );
      const result = await ps.execute({ maPhieuNhap });
      await ps.unprepare();

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu nhập." });
    }
  }
);

// 3. Cập nhật chi tiết phiếu nhập
receiptDetailRouter.put("/api/chitietphieunhap/:id", async (req, res) => {
  const { id } = req.params;
  const { SoLuong, GiaSanPham } = req.body;

  try {
    const request = new sql.Request();
    request.input("SoLuong", sql.Int, SoLuong);
    request.input("GiaSanPham", sql.Decimal, GiaSanPham);

    await request.query(
      "UPDATE ChiTietPhieuNhap SET SoLuong = @SoLuong, GiaSanPham = @GiaSanPham WHERE Id = @Id"
    );

    res.status(200).json({ message: "Chi tiết phiếu nhập đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật chi tiết phiếu nhập." });
  }
});

// 4. Xóa chi tiết phiếu nhập
receiptDetailRouter.delete("/api/chitietphieunhap/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const request = new sql.Request();
    request.input("Id", sql.Int, id); // Giả sử Id là kiểu Int

    await request.query("DELETE FROM ChiTietPhieuNhap WHERE Id = @Id");

    res.status(200).json({ message: "Chi tiết phiếu nhập đã được xóa." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết phiếu nhập." });
  }
});

module.exports = receiptDetailRouter;
