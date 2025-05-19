const orderRouter = require("express").Router();
const pool = require("../db"); // pool MySQL đã được tạo với mysql2/promise

// Endpoint gợi ý mã đơn hàng lớn nhất
orderRouter.get("/api/donhang/max-madonhang", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT MaDonHang FROM DonHang ORDER BY MaDonHang DESC LIMIT 1`
    );

    if (rows.length > 0) {
      const maxMaDonHang = rows[0].MaDonHang;
      return res.json({ maxMaDonHang });
    } else {
      return res.json({ maxMaDonHang: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã đơn hàng lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng đơn hàng
orderRouter.get("/api/donhang", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT dh.*, nc.TenNhaCungCap, nv.TenNhanVien
       FROM DonHang dh
       LEFT JOIN NhaCungCap nc ON dh.MaNhaCungCap = nc.MaNhaCungCap
       LEFT JOIN NhanVien nv ON dh.MaNhanVien = nv.MaNhanVien`
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho chi tiết đơn hàng
orderRouter.get("/api/donhang/:maDonHang", async (req, res) => {
  const { maDonHang } = req.params;

  try {
    // Lấy đơn hàng
    const [donHangRows] = await pool.execute(
      "SELECT * FROM DonHang WHERE MaDonHang = ?",
      [maDonHang]
    );

    if (donHangRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    // Lấy danh sách sản phẩm liên quan
    const [sanPhamRows] = await pool.execute(
      "SELECT * FROM ChiTietDonHang WHERE MaDonHang = ?",
      [maDonHang]
    );

    const responseData = {
      ...donHangRows[0],
      SanPhamList: sanPhamRows,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng." });
  }
});

// Endpoint cho thêm đơn hàng
orderRouter.post("/api/donhang", async (req, res) => {
  try {
    const { MaDonHang, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa } = req.body;

    console.log("Dữ liệu nhận được:", req.body);

    const sqlQuery = `
      INSERT INTO DonHang (MaDonHang, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sqlQuery, [
      MaDonHang,
      MaNhaCungCap,
      MaNhanVien,
      NgayNhap,
      MoTa,
    ]);

    res.status(201).json({ MaDonHang });
  } catch (err) {
    console.error("Lỗi khi thêm đơn hàng:", err);
    res.status(500).send("Lỗi khi thêm đơn hàng");
  }
});

// Cập nhật tổng giá trị đơn hàng
orderRouter.put("/api/donhang/:maDonHang", async (req, res) => {
  const { maDonHang } = req.params;
  const { TongGiaTri } = req.body;

  try {
    await pool.execute(
      "UPDATE DonHang SET TongGiaTri = ? WHERE MaDonHang = ?",
      [TongGiaTri, maDonHang]
    );

    res
      .status(200)
      .json({ message: "Tổng giá trị đơn hàng đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật đơn hàng." });
  }
});

// Endpoint xóa đơn hàng
orderRouter.delete("/api/donhang/:maDonHang", async (req, res) => {
  const maDonHang = req.params.maDonHang;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa chi tiết đơn hàng trước
    await connection.execute("DELETE FROM ChiTietDonHang WHERE MaDonHang = ?", [
      maDonHang,
    ]);

    // Xóa đơn hàng
    const [result] = await connection.execute(
      "DELETE FROM DonHang WHERE MaDonHang = ?",
      [maDonHang]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).send("Đơn hàng không tìm thấy.");
    }

    await connection.commit();
    res.json({
      message: "Đơn hàng và chi tiết đơn hàng đã được xóa thành công!",
    });
  } catch (err) {
    await connection.rollback();
    console.error("Lỗi khi xóa đơn hàng và chi tiết:", err);
    res.status(500).send("Lỗi khi xóa đơn hàng");
  } finally {
    connection.release();
  }
});

orderRouter.put(
  "/api/donhang/:maDonHang/capnhat-trangthai",
  async (req, res) => {
    const { maDonHang } = req.params;
    const { TrangThai } = req.body;

    if (!TrangThai) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin trạng thái cần cập nhật.",
      });
    }

    try {
      const updateQuery = `
      UPDATE DonHang
      SET TrangThai = ?
      WHERE MaDonHang = ?
    `;

      const [result] = await pool.query(updateQuery, [TrangThai, maDonHang]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng với mã này.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công.",
        maDonHang,
        TrangThai,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái đơn hàng.",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

module.exports = orderRouter;
