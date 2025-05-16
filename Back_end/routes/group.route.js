const { Router } = require("express");
const pool = require("../db");

const groupRouter = new Router();

// Lấy danh sách nhóm sản phẩm
groupRouter.get("/api/nhomsanpham", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM NhomSanPham");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy nhóm sản phẩm theo mã nhóm
groupRouter.get("/api/nhomsanpham/:maNhom", async (req, res) => {
  const { maNhom } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM NhomSanPham WHERE MaNhom = ?",
      [maNhom]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "Nhóm sản phẩm không tìm thấy" });
    }
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết nhóm sản phẩm:", err);
    res.status(500).json({ message: "Lỗi khi truy vấn cơ sở dữ liệu" });
  }
});

// Thêm nhóm sản phẩm
groupRouter.post("/api/nhomsanpham", async (req, res) => {
  const { TenNhom, MoTa } = req.body;
  try {
    const sql = "INSERT INTO NhomSanPham (TenNhom, MoTa) VALUES (?, ?)";
    await pool.query(sql, [TenNhom, MoTa]);
    res.status(201).json({ message: "Nhóm sản phẩm đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi thêm nhóm sản phẩm");
  }
});

// Cập nhật nhóm sản phẩm
groupRouter.put("/api/nhomsanpham/:maNhom", async (req, res) => {
  const { maNhom } = req.params;
  const { TenNhom, MoTa } = req.body;
  try {
    const sql = "UPDATE NhomSanPham SET TenNhom = ?, MoTa = ? WHERE MaNhom = ?";
    const [result] = await pool.query(sql, [TenNhom, MoTa, maNhom]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Nhóm sản phẩm không tìm thấy.");
    }

    res.json({ message: "Nhóm sản phẩm đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi cập nhật nhóm sản phẩm");
  }
});

// Xóa nhóm sản phẩm
groupRouter.delete("/api/nhomsanpham/:maNhom", async (req, res) => {
  const { maNhom } = req.params;
  try {
    const sql = "DELETE FROM NhomSanPham WHERE MaNhom = ?";
    const [result] = await pool.query(sql, [maNhom]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Nhóm sản phẩm không tìm thấy.");
    }

    res.json({ message: "Nhóm sản phẩm đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi xóa nhóm sản phẩm");
  }
});

module.exports = groupRouter;
