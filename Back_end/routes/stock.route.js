const { Router } = require("express");
const pool = require("../db");

const stockRouter = new Router();

stockRouter.put("/capnhat", async (req, res) => {
  const { maSanPham, soLuong } = req.body;
  try {
    await pool.execute(
      `UPDATE SanPham_Copy SET SoLuongTon = IFNULL(SoLuongTon, 0) + ? WHERE MaSanPham = ?`,
      [soLuong, maSanPham]
    );

    res.status(200).json({ message: "Cập nhật SoLuongTon thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật SoLuongTon" });
  }
});

module.exports = stockRouter;
