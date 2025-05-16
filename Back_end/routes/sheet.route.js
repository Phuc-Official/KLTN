const { Router } = require("express");
const pool = require("../db");

const sheetRouter = new Router();

// 1. Lấy mã phiếu kiểm kê lớn nhất
sheetRouter.get("/api/phieukiemke/max-maphieu", async (req, res) => {
  try {
    // MySQL không có TOP, dùng LIMIT 1
    const sqlQuery = `
      SELECT MaPhieuKiemKe
      FROM PhieuKiemKe
      ORDER BY MaPhieuKiemKe DESC
      LIMIT 1
    `;

    const [rows] = await pool.execute(sqlQuery);

    if (rows.length > 0) {
      const maxMaPhieuKiemKe = rows[0].MaPhieuKiemKe;
      return res.json({ maxMaPhieuKiemKe });
    } else {
      return res.json({ maxMaPhieuKiemKe: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu kiểm kê lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// 2. Lấy danh sách phiếu kiểm kê
sheetRouter.get("/api/phieukiemke", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT pk.*, nv.TenNhanVien
      FROM PhieuKiemKe pk
      LEFT JOIN NhanVien nv ON pk.MaNhanVien = nv.MaNhanVien
    `;
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// 3. Lấy chi tiết phiếu kiểm kê và danh sách sản phẩm liên quan
sheetRouter.get("/api/phieukiemke/:maPhieuKiemKe", async (req, res) => {
  const { maPhieuKiemKe } = req.params;

  try {
    // Lấy phiếu kiểm kê
    const [phieuRows] = await pool.execute(
      `SELECT * FROM PhieuKiemKe WHERE MaPhieuKiemKe = ?`,
      [maPhieuKiemKe]
    );

    if (phieuRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu kiểm kê." });
    }

    // Lấy danh sách sản phẩm liên quan
    const [productsRows] = await pool.execute(
      `SELECT * FROM ChiTietPhieuKiemKe WHERE MaPhieuKiemKe = ?`,
      [maPhieuKiemKe]
    );

    const responseData = {
      ...phieuRows[0],
      SanPhamList: productsRows,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu kiểm kê:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu kiểm kê." });
  }
});

// 4. Thêm phiếu kiểm kê
sheetRouter.post("/api/phieukiemke", async (req, res) => {
  console.log("Dữ liệu nhận được cho phiếu kiểm kê:", req.body);
  try {
    const { MaPhieuKiemKe, MaNhanVien, NgayTao, MoTa, TenPhieu } = req.body;

    const sqlQuery = `
      INSERT INTO PhieuKiemKe (MaPhieuKiemKe, MaNhanVien, NgayTao, MoTa, TenPhieu)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      MaPhieuKiemKe,
      MaNhanVien,
      NgayTao,
      MoTa,
      TenPhieu,
    ]);

    res.status(201).json({ MaPhieuKiemKe });
  } catch (err) {
    console.error("Lỗi khi thêm phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi thêm phiếu kiểm kê");
  }
});

// 5. Thêm chi tiết phiếu kiểm kê
sheetRouter.post("/api/chitietphieukiemke", async (req, res) => {
  console.log("Dữ liệu nhận được cho chi tiết phiếu kiểm kê:", req.body);
  try {
    const { MaPhieuKiemKe, MaSanPham, SoLuongThucTe, MaDonViKhac, SoLuongTon } =
      req.body;

    const sqlQuery = `
      INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaSanPham, SoLuongThucTe, MaDonViKhac, SoLuongTon)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      MaPhieuKiemKe,
      MaSanPham,
      SoLuongThucTe,
      MaDonViKhac,
      SoLuongTon,
    ]);

    res.status(201).json({ MaPhieuKiemKe });
  } catch (err) {
    console.error("Lỗi khi thêm chi tiết phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi thêm chi tiết phiếu kiểm kê");
  }
});

// 6. Xóa phiếu kiểm kê
sheetRouter.delete("/api/phieukiemke/:maPhieuKiemKe", async (req, res) => {
  const { maPhieuKiemKe } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM PhieuKiemKe WHERE MaPhieuKiemKe = ?`,
      [maPhieuKiemKe]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Phiếu kiểm kê không tìm thấy.");
    }

    res.json({ message: "Phiếu kiểm kê đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi xóa phiếu kiểm kê");
  }
});

module.exports = sheetRouter;
