const pool = require("../db");
const bcrypt = require("bcryptjs");
const { Router } = require("express");

const employeeRouter = new Router();

// Lấy tất cả nhân viên
employeeRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM NhanVien");
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi truy vấn nhân viên", error: err.message });
  }
});

// Lấy nhân viên theo mã
employeeRouter.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM NhanVien WHERE MaNhanVien = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
    res.json(rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi truy vấn nhân viên", error: err.message });
  }
});

// Thêm nhân viên
employeeRouter.post("/api/nhanvien", async (req, res) => {
  const { MaNhanVien, TenDangNhap, MatKhau, TenNhanVien, IsAdmin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    const sql = `
      INSERT INTO NhanVien (MaNhanVien, TenDangNhap, MatKhau, TenNhanVien, IsAdmin)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      MaNhanVien,
      TenDangNhap,
      hashedPassword,
      TenNhanVien,
      IsAdmin,
    ]);
    res.status(201).json({ message: "Thêm nhân viên thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi thêm nhân viên", error: err.message });
  }
});

// Cập nhật nhân viên
employeeRouter.put("/:id", async (req, res) => {
  const { TenDangNhap, MatKhau, TenNhanVien, IsAdmin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    const sql = `
      UPDATE NhanVien
      SET TenDangNhap = ?, MatKhau = ?, TenNhanVien = ?, IsAdmin = ?
      WHERE MaNhanVien = ?
    `;

    const [result] = await pool.query(sql, [
      TenDangNhap,
      hashedPassword,
      TenNhanVien,
      IsAdmin,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhân viên để cập nhật" });
    }

    res.json({ message: "Cập nhật nhân viên thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật nhân viên", error: err.message });
  }
});

// Xóa nhân viên
employeeRouter.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM NhanVien WHERE MaNhanVien = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhân viên để xóa" });
    }

    res.json({ message: "Xóa nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa nhân viên", error: err.message });
  }
});

// Đăng nhập
employeeRouter.post("/api/nhanvien/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM NhanVien WHERE TenDangNhap = ?",
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Tên đăng nhập không tồn tại." });
    }
    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.MatKhau);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng." });
    }

    delete user.MatKhau; // không trả mật khẩu về client
    res.status(200).json({ message: "Đăng nhập thành công", user });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ.", error: err.message });
  }
});

// Lấy mã nhân viên lớn nhất
employeeRouter.get("/api/nhanvien/max-manhanvien", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT MAX(MaNhanVien) AS maxMaNhanVien FROM NhanVien"
    );
    res.json({ maxMaNhanVien: rows[0].maxMaNhanVien });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = employeeRouter;
