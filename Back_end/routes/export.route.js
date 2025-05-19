const { Router } = require("express");
const pool = require("../db");

const exportRouter = new Router();

// Lấy danh sách khách hàng
exportRouter.get("/api/khachhang", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM KhachHang");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khách hàng:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy mã phiếu xuất lớn nhất (MySQL dùng LIMIT 1)
exportRouter.get("/api/phieuxuat/max-maphieuxuat", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT MaPhieuXuat
      FROM PhieuXuat
      ORDER BY MaPhieuXuat DESC
      LIMIT 1
    `);

    if (rows.length > 0) {
      res.json({ maxMaPhieuXuat: rows[0].MaPhieuXuat });
    } else {
      res.json({ maxMaPhieuXuat: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu xuất lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách phiếu xuất cùng tên khách hàng và nhân viên
exportRouter.get("/api/phieuxuat", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT px.*, kh.TenKhachHang, nv.TenNhanVien
      FROM PhieuXuat px
      LEFT JOIN KhachHang kh ON px.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON px.MaNhanVien = nv.MaNhanVien
    `);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy chi tiết phiếu xuất theo mã phiếu
exportRouter.get("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const { maPhieuXuat } = req.params;

  try {
    const [[phieuXuat]] = await pool.query(
      "SELECT * FROM PhieuXuat WHERE MaPhieuXuat = ?",
      [maPhieuXuat]
    );

    if (!phieuXuat) {
      return res.status(404).json({ message: "Không tìm thấy phiếu xuất." });
    }

    const [sanPhamList] = await pool.query(
      "SELECT * FROM ChiTietPhieuXuat WHERE MaPhieuXuat = ?",
      [maPhieuXuat]
    );

    const responseData = {
      ...phieuXuat,
      SanPhamList: sanPhamList,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu xuất:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu xuất." });
  }
});

// Thêm phiếu xuất
exportRouter.post("/api/phieuxuat", async (req, res) => {
  try {
    const { MaPhieuXuat, MaKhachHang, MaNhanVien, NgayXuat, MoTa } = req.body;

    const sql = `
      INSERT INTO PhieuXuat (MaPhieuXuat, MaKhachHang, MaNhanVien, NgayXuat, MoTa)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      MaPhieuXuat,
      MaKhachHang,
      MaNhanVien,
      NgayXuat,
      MoTa,
    ]);

    res.status(201).json({ MaPhieuXuat });
  } catch (err) {
    console.error("Lỗi khi thêm phiếu xuất:", err);
    res.status(500).send("Lỗi khi thêm phiếu xuất");
  }
});

// Cập nhật tổng giá trị phiếu xuất
exportRouter.put("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const { maPhieuXuat } = req.params;
  const { TongGiaTri } = req.body;

  try {
    const sql = `
      UPDATE PhieuXuat SET TongGiaTri = ? WHERE MaPhieuXuat = ?
    `;

    const [result] = await pool.query(sql, [TongGiaTri, maPhieuXuat]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phiếu xuất để cập nhật." });
    }

    res
      .status(200)
      .json({ message: "Tổng giá trị phiếu xuất đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật phiếu xuất." });
  }
});

// Xóa phiếu xuất
exportRouter.delete("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const maPhieuXuat = req.params.maPhieuXuat;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả chi tiết phiếu xuất liên quan
    await connection.execute(
      "DELETE FROM ChiTietPhieuXuat WHERE MaPhieuXuat = ?",
      [maPhieuXuat]
    );

    // Sau đó mới xóa phiếu xuất cha
    const [result] = await connection.execute(
      "DELETE FROM PhieuXuat WHERE MaPhieuXuat = ?",
      [maPhieuXuat]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send("Phiếu xuất không tìm thấy.");
    }

    await connection.commit();
    res.json({ message: "Phiếu xuất đã được xóa thành công!" });
  } catch (err) {
    await connection.rollback();
    console.error("Lỗi khi xóa phiếu xuất:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = exportRouter;
