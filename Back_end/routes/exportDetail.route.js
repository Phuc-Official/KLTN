const { Router } = require("express");
const pool = require("../db");

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
    // Kiểm tra tồn kho
    const [stockRows] = await pool.query(
      "SELECT SoLuongTon FROM DonViKhac WHERE ID = ?",
      [MaDonViKhac]
    );

    if (stockRows.length === 0) {
      return res.status(400).json({ message: "Đơn vị tính không tồn tại." });
    }

    const currentStock = stockRows[0].SoLuongTon;
    if (currentStock < SoLuong) {
      return res.status(400).json({
        message: `Số lượng tồn kho không đủ. Hiện có: ${currentStock}`,
      });
    }

    // Thêm chi tiết phiếu xuất
    await pool.query(
      "INSERT INTO ChiTietPhieuXuat (MaPhieuXuat, MaSanPham, SoLuong, MaDonViKhac) VALUES (?, ?, ?, ?)",
      [MaPhieuXuat, MaSanPham, SoLuong, MaDonViKhac]
    );

    // Cập nhật tồn kho
    await pool.query(
      "UPDATE DonViKhac SET SoLuongTon = IFNULL(SoLuongTon, 0) - ? WHERE ID = ?",
      [SoLuong, MaDonViKhac]
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
      const [rows] = await pool.query(
        "SELECT * FROM ChiTietPhieuXuat WHERE MaPhieuXuat = ?",
        [maPhieuXuat]
      );
      res.status(200).json(rows);
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
    const [result] = await pool.query(
      "UPDATE ChiTietPhieuXuat SET SoLuong = ?, GiaSanPham = ? WHERE Id = ?",
      [SoLuong, GiaSanPham, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Chi tiết phiếu xuất không tồn tại." });
    }

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
    const [result] = await pool.query(
      "DELETE FROM ChiTietPhieuXuat WHERE Id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Chi tiết phiếu xuất không tồn tại." });
    }

    res.status(200).json({ message: "Chi tiết phiếu xuất đã được xóa." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa chi tiết phiếu xuất." });
  }
});

module.exports = exportDetailRouter;
