const { Router } = require("express");
const pool = require("../db"); // pool mysql2 đã cấu hình

const supplierRouter = new Router();

// Lấy danh sách nhà cung cấp
supplierRouter.get("/api/nha-cung-cap", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhaCungCap`;
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhà cung cấp:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy chi tiết nhà cung cấp
supplierRouter.get("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;

  try {
    const sqlQuery = `SELECT * FROM NhaCungCap WHERE MaNhaCungCap = ?`;
    const [rows] = await pool.execute(sqlQuery, [maNhaCungCap]);

    if (rows.length > 0) {
      return res.json(rows[0]);
    } else {
      return res.status(404).json({ message: "Nhà cung cấp không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết nhà cung cấp:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy chi tiết nhà cung cấp" });
  }
});

// Thêm nhà cung cấp
supplierRouter.post("/api/nha-cung-cap", async (req, res) => {
  try {
    const {
      MaNhaCungCap,
      TenNhaCungCap,
      SoDienThoai,
      Email,
      MaSoThue,
      DiaChi,
    } = req.body;

    const sqlQuery = `
      INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, MaSoThue, DiaChi)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      MaNhaCungCap,
      TenNhaCungCap,
      SoDienThoai,
      Email,
      MaSoThue,
      DiaChi,
    ]);

    res.status(201).json({ message: "Nhà cung cấp đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm nhà cung cấp:", err);
    res.status(500).send("Lỗi khi thêm nhà cung cấp");
  }
});

// Cập nhật nhà cung cấp
supplierRouter.put("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;
  const { TenNhaCungCap, SoDienThoai, Email, MaSoThue, DiaChi } = req.body;

  try {
    const sqlQuery = `
      UPDATE NhaCungCap
      SET TenNhaCungCap = ?, SoDienThoai = ?, Email = ?, MaSoThue = ?, DiaChi = ?
      WHERE MaNhaCungCap = ?
    `;

    const [result] = await pool.execute(sqlQuery, [
      TenNhaCungCap,
      SoDienThoai,
      Email,
      MaSoThue,
      DiaChi,
      maNhaCungCap,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Nhà cung cấp không tìm thấy.");
    }

    res.json({ message: "Nhà cung cấp đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật nhà cung cấp:", err);
    res.status(500).send("Lỗi khi cập nhật nhà cung cấp");
  }
});

supplierRouter.put("/api/capnhat", async (req, res) => {
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

// Xóa nhà cung cấp
supplierRouter.delete("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;

  try {
    const sqlQuery = `DELETE FROM NhaCungCap WHERE MaNhaCungCap = ?`;
    const [result] = await pool.execute(sqlQuery, [maNhaCungCap]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Nhà cung cấp không tìm thấy.");
    }

    res.json({ message: "Nhà cung cấp đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa nhà cung cấp:", err);
    res.status(500).send("Lỗi khi xóa nhà cung cấp");
  }
});

module.exports = supplierRouter;
