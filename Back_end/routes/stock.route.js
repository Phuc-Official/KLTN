const { Router } = require("express");
const pool = require("../db");

const stockRouter = new Router();

stockRouter.put("/api/updatestock", async (req, res) => {
  const { maSanPham, soLuong } = req.body;

  if (!maSanPham || typeof soLuong !== "number") {
    return res
      .status(400)
      .json({ message: "Thiếu maSanPham hoặc soLuong không hợp lệ" });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE SanPham_Copy SET SoLuongTon = IFNULL(SoLuongTon, 0) + ? WHERE MaSanPham = ?`,
      [soLuong, maSanPham]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để cập nhật" });
    }

    res.status(200).json({ message: "Cập nhật SoLuongTon thành công" });
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật SoLuongTon" });
  }
});

module.exports = stockRouter;
