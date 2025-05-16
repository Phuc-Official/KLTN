const { Router } = require("express");
const pool = require("../db"); // pool mysql2/promise

const orderDetailRouter = new Router();

// 1. Thêm chi tiết đơn hàng
orderDetailRouter.post("/api/chitietdonhang", async (req, res) => {
  const { MaDonHang, MaSanPham, SoLuong, MaDonViKhac } = req.body;

  if (!MaDonHang || !MaSanPham || !SoLuong || !MaDonViKhac) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SoLuong <= 0) {
    return res.status(400).json({ message: "Số lượng phải lớn hơn 0." });
  }

  try {
    const sqlQuery = `
      INSERT INTO ChiTietDonHang (MaDonHang, MaSanPham, SoLuong, MaDonViKhac)
      VALUES (?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [MaDonHang, MaSanPham, SoLuong, MaDonViKhac]);

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
    const sqlQuery = `SELECT * FROM ChiTietDonHang WHERE MaDonHang = ?`;
    const [rows] = await pool.execute(sqlQuery, [maDonHang]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng." });
  }
});

// 3. Cập nhật chi tiết đơn hàng
orderDetailRouter.put("/api/chitietdonhang/:id", async (req, res) => {
  const { id } = req.params;
  const { SoLuong, GiaSanPham } = req.body;

  try {
    const sqlQuery = `
      UPDATE ChiTietDonHang
      SET SoLuong = ?, GiaSanPham = ?
      WHERE Id = ?
    `;

    await pool.execute(sqlQuery, [SoLuong, GiaSanPham, id]);

    res.status(200).json({ message: "Chi tiết đơn hàng đã được cập nhật." });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật chi tiết đơn hàng." });
  }
});

// 4. Xóa chi tiết đơn hàng
orderDetailRouter.delete("/api/chitietdonhang/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sqlQuery = `DELETE FROM ChiTietDonHang WHERE Id = ?`;
    const [result] = await pool.execute(sqlQuery, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Chi tiết đơn hàng không tìm thấy." });
    }

    res.status(200).json({ message: "Chi tiết đơn hàng đã được xóa." });
  } catch (error) {
    console.error("Lỗi khi xóa chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết đơn hàng." });
  }
});

module.exports = orderDetailRouter;
