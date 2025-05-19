const { Router } = require("express");
const pool = require("../db"); // pool mysql2 đã được tạo

const receiptRouter = new Router();

// Lấy danh sách nhà cung cấp
receiptRouter.get("/api/nhacungcap", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM NhaCungCap");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhà cung cấp:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách nhân viên
receiptRouter.get("/api/nhanvien", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM NhanVien");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy mã phiếu nhập lớn nhất
receiptRouter.get("/api/phieunhap/max-maphieunhap", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT MaPhieuNhap
      FROM PhieuNhap_Copy
      ORDER BY MaPhieuNhap DESC
      LIMIT 1
    `);

    if (rows.length > 0) {
      const maxMaPhieuNhap = rows[0].MaPhieuNhap;
      return res.json({ maxMaPhieuNhap });
    } else {
      return res.json({ maxMaPhieuNhap: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu nhập lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách phiếu nhập
receiptRouter.get("/api/phieunhap", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pn.*, nc.TenNhaCungCap, nv.TenNhanVien
      FROM PhieuNhap_Copy pn
      LEFT JOIN NhaCungCap nc ON pn.MaNhaCungCap = nc.MaNhaCungCap
      LEFT JOIN NhanVien nv ON pn.MaNhanVien = nv.MaNhanVien
    `);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy chi tiết phiếu nhập cùng danh sách sản phẩm
receiptRouter.get("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const { maPhieuNhap } = req.params;

  try {
    // Lấy thông tin phiếu nhập
    const [phieuNhapRows] = await pool.execute(
      "SELECT * FROM PhieuNhap_Copy WHERE MaPhieuNhap = ?",
      [maPhieuNhap]
    );

    if (phieuNhapRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu nhập." });
    }

    // Lấy danh sách sản phẩm liên quan
    const [productsRows] = await pool.execute(
      "SELECT * FROM ChiTietPhieuNhap WHERE MaPhieuNhap = ?",
      [maPhieuNhap]
    );

    const responseData = {
      ...phieuNhapRows[0],
      SanPhamList: productsRows,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu nhập:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu nhập." });
  }
});

// Thêm phiếu nhập
receiptRouter.post("/api/phieunhap", async (req, res) => {
  try {
    const { MaPhieuNhap, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa } = req.body;

    const sqlQuery = `
      INSERT INTO PhieuNhap_Copy (MaPhieuNhap, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      MaPhieuNhap,
      MaNhaCungCap,
      MaNhanVien,
      NgayNhap,
      MoTa,
    ]);

    res.status(201).json({ MaPhieuNhap });
  } catch (err) {
    console.error("Lỗi khi thêm phiếu nhập:", err);
    res.status(500).send("Lỗi khi thêm phiếu nhập");
  }
});

// Cập nhật tổng giá trị phiếu nhập
receiptRouter.put("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const { maPhieuNhap } = req.params;
  const { TongGiaTri } = req.body;

  try {
    await pool.execute(
      "UPDATE PhieuNhap_Copy SET TongGiaTri = ? WHERE MaPhieuNhap = ?",
      [TongGiaTri, maPhieuNhap]
    );

    res
      .status(200)
      .json({ message: "Tổng giá trị phiếu nhập đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật phiếu nhập." });
  }
});

// Xóa phiếu nhập
receiptRouter.delete("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const maPhieuNhap = req.params.maPhieuNhap;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa chi tiết phiếu nhập trước (nếu có)
    await connection.execute(
      "DELETE FROM ChiTietPhieuNhap WHERE MaPhieuNhap = ?",
      [maPhieuNhap]
    );

    // Xóa phiếu nhập
    const [result] = await connection.execute(
      "DELETE FROM PhieuNhap_Copy WHERE MaPhieuNhap = ?",
      [maPhieuNhap]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send("Phiếu nhập không tìm thấy.");
    }

    await connection.commit();
    res.json({ message: "Phiếu nhập đã được xóa thành công!" });
  } catch (err) {
    await connection.rollback();
    console.error("Lỗi khi xóa phiếu nhập:", err);
    res.status(500).send("Lỗi khi xóa phiếu nhập");
  } finally {
    connection.release();
  }
});

module.exports = receiptRouter;
