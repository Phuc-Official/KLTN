const orderRouter = require("express").Router();
const sql = require("mssql");

// Endpoint gợi ý mã đơn hàng lớn nhất
orderRouter.get("/api/donhang/max-madonhang", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT TOP 1 MaDonHang
      FROM DonHang
      ORDER BY MaDonHang DESC
    `;

    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      const maxMaDonHang = result.recordset[0].MaDonHang;
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
    const sqlQuery = `
      SELECT dh.*, nc.TenNhaCungCap, nv.TenNhanVien
      FROM DonHang dh
      LEFT JOIN NhaCungCap nc ON dh.MaNhaCungCap = nc.MaNhaCungCap
      LEFT JOIN NhanVien nv ON dh.MaNhanVien = nv.MaNhanVien;      
    `;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho chi tiết đơn hàng
orderRouter.get("/api/donhang/:maDonHang", async (req, res) => {
  const { maDonHang } = req.params;

  try {
    const request = new sql.Request();
    request.input("MaDonHang", sql.NVarChar, maDonHang);

    const result = await request.query(
      "SELECT * FROM DonHang WHERE MaDonHang = @MaDonHang"
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    // Lấy danh sách sản phẩm liên quan
    const productsResult = await request.query(
      "SELECT * FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang"
    );

    const responseData = {
      ...result.recordset[0],
      SanPhamList: productsResult.recordset, // Thêm danh sách sản phẩm vào phản hồi
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

    console.log("Dữ liệu nhận được:", req.body); // Log dữ liệu nhận được

    const sqlQuery = `
        INSERT INTO DonHang (MaDonHang, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa)
        VALUES (@MaDonHang, @MaNhaCungCap, @MaNhanVien, @NgayNhap, @MoTa)
      `;

    const request = new sql.Request();
    request.input("MaDonHang", sql.NVarChar, MaDonHang);
    request.input("MaNhaCungCap", sql.NVarChar, MaNhaCungCap);
    request.input("MaNhanVien", sql.NVarChar, MaNhanVien);
    request.input("NgayNhap", sql.DateTime, NgayNhap);
    request.input("MoTa", sql.NVarChar, MoTa);
    // request.input("TongGiaTri", sql.Decimal, TongGiaTri);

    await request.query(sqlQuery);

    res.status(201).json({ MaDonHang }); // Trả về mã đơn hàng
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
    const request = new sql.Request();
    request.input("TongGiaTri", sql.Decimal, TongGiaTri);
    request.input("MaDonHang", sql.NVarChar, maDonHang);

    await request.query(
      "UPDATE DonHang SET TongGiaTri = @TongGiaTri WHERE MaDonHang = @MaDonHang"
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
  try {
    const sqlQuery = `DELETE FROM DonHang WHERE MaDonHang = @maDonHang`;
    const request = new sql.Request();
    request.input("maDonHang", sql.NVarChar, maDonHang);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Đơn hàng không tìm thấy.");
    }

    res.json({ message: "Đơn hàng đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa đơn hàng:", err);
    res.status(500).send("Lỗi khi xóa đơn hàng");
  }
});

module.exports = orderRouter;
