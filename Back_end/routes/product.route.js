const { Router } = require("express");
const pool = require("../db"); // pool mysql2/promise

const productRouter = new Router();

// Lấy danh sách đơn vị tính
productRouter.get("/api/donvitinh", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM DonViKhac`;
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đơn vị tính:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách nhóm sản phẩm (nếu cần thì bỏ comment và dùng tương tự)
// productRouter.get("/api/nhomsanpham", async (req, res) => {
//   try {
//     const sqlQuery = `SELECT * FROM NhomSanPham`;
//     const [rows] = await pool.execute(sqlQuery);
//     res.json(rows);
//   } catch (err) {
//     console.error("Lỗi khi lấy danh sách nhóm:", err);
//     res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
//   }
// });

// Lấy mã sản phẩm lớn nhất
productRouter.get("/api/sanpham/max-masanpham", async (req, res) => {
  try {
    // MySQL không có TOP 1 mà dùng LIMIT 1
    const sqlQuery = `
      SELECT MaSanPham
      FROM SanPham_Copy
      ORDER BY MaSanPham DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(sqlQuery);

    if (rows.length > 0) {
      return res.json({ maxMaSanPham: rows[0].MaSanPham });
    } else {
      return res.json({ maxMaSanPham: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã sản phẩm lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách sản phẩm
productRouter.get("/api/sanpham", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT sp.*, nh.TenNhom
      FROM SanPham_Copy sp
      LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom
    `;
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Lấy chi tiết sản phẩm
productRouter.get("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const sqlQuery = `
      SELECT sp.*, nh.TenNhom, dv.TyLeQuyDoi, dv.TenDonVi
      FROM SanPham_Copy sp
      LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom
      LEFT JOIN DonViKhac dv ON sp.MaSanPham = dv.MaSanPham
      WHERE sp.MaSanPham = ?
    `;

    const [rows] = await pool.execute(sqlQuery, [maSanPham]);

    if (rows.length > 0) {
      return res.json(rows[0]);
    } else {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return res.status(500).json({ message: "Lỗi khi lấy chi tiết sản phẩm" });
  }
});

// Thêm sản phẩm
productRouter.post("/api/sanpham", async (req, res) => {
  const product = req.body;

  try {
    const sqlQuery = `
      INSERT INTO SanPham_Copy (MaSanPham, TenSanPham, TrongLuong, MoTaSanPham, MaNhom)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      product.MaSanPham,
      product.TenSanPham,
      product.TrongLuong,
      product.MoTaSanPham,
      product.MaNhom,
    ]);

    res.status(201).json({ message: "Sản phẩm đã được thêm thành công!" });
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    res.status(500).send("Lỗi khi thêm sản phẩm");
  }
});

// Cập nhật sản phẩm - sửa lại thành PUT và sửa endpoint nếu muốn
productRouter.put("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  const product = req.body;

  try {
    const sqlQuery = `
      UPDATE SanPham_Copy
      SET TenSanPham = ?, TrongLuong = ?, MoTaSanPham = ?, MaNhom = ?
      WHERE MaSanPham = ?
    `;

    const [result] = await pool.execute(sqlQuery, [
      product.TenSanPham,
      product.TrongLuong,
      product.MoTaSanPham,
      product.MaNhom,
      maSanPham,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }

    res.json({ message: "Sản phẩm đã được cập nhật thành công!" });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).send("Lỗi khi cập nhật sản phẩm");
  }
});

// Xóa sản phẩm
productRouter.delete("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Xóa dữ liệu liên quan ở bảng DonViKhac
    await connection.execute("DELETE FROM DonViKhac WHERE MaSanPham = ?", [
      maSanPham,
    ]);

    // Tiếp tục xóa sản phẩm ở SanPham_Copy
    const [result] = await connection.execute(
      "DELETE FROM SanPham_Copy WHERE MaSanPham = ?",
      [maSanPham]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).send("Sản phẩm không tìm thấy.");
    }

    await connection.commit();
    connection.release();
    res.json({ message: "Sản phẩm đã được xóa thành công!" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Lỗi khi xóa sản phẩm:", err);
    res.status(500).send("Lỗi khi xóa sản phẩm");
  }
});

// Cập nhật số lượng tồn
productRouter.put("/api/sanpham/:maSanPham/stock", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  const { SoLuong } = req.body;

  try {
    const sqlQuery = `
      UPDATE DonViKhac
      SET SoLuongTon = SoLuongTon + ?
      WHERE MaSanPham = ?
    `;

    const [result] = await pool.execute(sqlQuery, [SoLuong, maSanPham]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Sản phẩm không tìm thấy.");
    }

    res.json({ message: "Số lượng tồn đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật số lượng tồn:", err);
    res.status(500).send("Lỗi khi cập nhật số lượng tồn");
  }
});

// POST /sanpham/capnhat-ton
productRouter.post("/api/capnhatton", async (req, res) => {
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

module.exports = productRouter;
