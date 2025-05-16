const { Router } = require("express");
const pool = require("../db"); // pool mysql2 đã được tạo

const receiptDetailRouter = new Router();

// 1. Thêm chi tiết phiếu nhập
receiptDetailRouter.post("/api/chitietphieunhap", async (req, res) => {
  const { MaPhieuNhap, MaSanPham, SoLuong, MaDonViKhac } = req.body;

  if (!MaPhieuNhap || !MaSanPham || !SoLuong || !MaDonViKhac) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SoLuong <= 0) {
    return res.status(400).json({ message: "Số lượng phải lớn hơn 0." });
  }

  try {
    // Thêm chi tiết phiếu nhập
    await pool.execute(
      `INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaSanPham, SoLuong, MaDonViKhac)
       VALUES (?, ?, ?, ?)`,
      [MaPhieuNhap, MaSanPham, SoLuong, MaDonViKhac]
    );

    // Cập nhật số lượng tồn kho trong bảng DonViKhac
    await pool.execute(
      `UPDATE DonViKhac 
       SET SoLuongTon = IFNULL(SoLuongTon, 0) + ? 
       WHERE ID = ?`,
      [SoLuong, MaDonViKhac]
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
      const [rows] = await pool.execute(
        `SELECT * FROM ChiTietPhieuNhap WHERE MaPhieuNhap = ?`,
        [maPhieuNhap]
      );
      res.status(200).json(rows);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết phiếu nhập:", error);
      res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu nhập." });
    }
  }
);

// 3. Cập nhật chi tiết phiếu nhập
receiptDetailRouter.put("/api/chitietphieunhap/:id", async (req, res) => {
  const { id } = req.params;
  const { SoLuong, GiaSanPham } = req.body;

  try {
    await pool.execute(
      `UPDATE ChiTietPhieuNhap SET SoLuong = ?, GiaSanPham = ? WHERE Id = ?`,
      [SoLuong, GiaSanPham, id]
    );

    res.status(200).json({ message: "Chi tiết phiếu nhập đã được cập nhật." });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi tiết phiếu nhập:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chi tiết phiếu nhập." });
  }
});

// 4. Xóa chi tiết phiếu nhập
receiptDetailRouter.delete("/api/chitietphieunhap/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM ChiTietPhieuNhap WHERE Id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Chi tiết phiếu nhập không tìm thấy." });
    }

    res.status(200).json({ message: "Chi tiết phiếu nhập đã được xóa." });
  } catch (error) {
    console.error("Lỗi khi xóa chi tiết phiếu nhập:", error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết phiếu nhập." });
  }
});

module.exports = receiptDetailRouter;
