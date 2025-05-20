const { Router } = require("express");
const pool = require("../db");

const unitRouter = new Router();

// Lấy tỷ lệ quy đổi đơn vị tính theo unitId
unitRouter.get("/api/donvitinh/:unitId", async (req, res) => {
  const unitId = req.params.unitId;

  try {
    const sqlQuery = `SELECT TyLeQuyDoi FROM DonViTinh WHERE MaDonVi = ?`;
    const [rows] = await pool.execute(sqlQuery, [unitId]);

    if (rows.length > 0) {
      res.json({ conversionRate: rows[0].TyLeQuyDoi });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn vị tính." });
    }
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({ message: "Lỗi khi lấy tỷ lệ quy đổi." });
  }
});

// Thêm đơn vị tính khác
unitRouter.post("/api/donvitinhkhac", async (req, res) => {
  const unit = req.body;

  try {
    const sqlQuery = `
      INSERT INTO DonViKhac (MaSanPham, TenDonVi, TyLeQuyDoi, SoLuongTon)
      VALUES (?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      unit.MaSanPham,
      unit.TenDonVi,
      unit.TyLeQuyDoi,
      unit.SoLuongTon,
    ]);

    res.status(201).json({ message: "Đơn vị tính đã được thêm thành công!" });
  } catch (error) {
    console.error("Lỗi khi thêm đơn vị tính:", error);
    res.status(500).send("Lỗi khi thêm đơn vị tính");
  }
});

// Lấy danh sách đơn vị tính khác theo mã sản phẩm
unitRouter.get("/api/donvitinhkhac/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const sqlQuery = `
      SELECT * FROM DonViKhac WHERE MaSanPham = ?
    `;
    const [rows] = await pool.execute(sqlQuery, [maSanPham]);

    if (rows.length > 0) {
      res.json(rows);
    } else {
      res
        .status(404)
        .json({ message: "Không tìm thấy đơn vị tính cho mã sản phẩm này." });
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

// Lấy tỷ lệ quy đổi đơn vị tính khác theo mã sản phẩm và ID đơn vị
unitRouter.get("/api/donvikhac/by-product/:maSanPham/:iD", async (req, res) => {
  const { maSanPham, iD } = req.params;

  try {
    const sqlQuery = `
      SELECT TyLeQuyDoi FROM DonViKhac WHERE MaSanPham = ? AND ID = ?
    `;

    const [rows] = await pool.execute(sqlQuery, [maSanPham, iD]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({
        message: "Không tìm thấy tỷ lệ quy đổi cho sản phẩm và đơn vị này.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu." });
  }
});

// Lấy tên đơn vị tính khác theo ID
unitRouter.get("/api/donvikhac/by-id/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sqlQuery = `SELECT TenDonVi FROM DonViKhac WHERE ID = ?`;
    const [rows] = await pool.execute(sqlQuery, [id]);

    if (rows.length > 0) {
      res.json({ TenDonVi: rows[0].TenDonVi });
    } else {
      res.status(404).json({ message: "Không tìm thấy tên đơn vị." });
    }
  } catch (error) {
    console.error("Lỗi khi lấy tên đơn vị:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

unitRouter.put("/api/capnhatton", async (req, res) => {
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

module.exports = unitRouter;
