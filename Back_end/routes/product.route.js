const { Router } = require("express");
const sql = require("mssql"); // Import thư viện mssql

const productRouter = new Router();

// Lấy danh sách đơn vị tính
productRouter.get("/api/donvitinh", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM DonViKhac`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đơn vị tính:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Lấy danh sách nhóm sản phẩm
productRouter.get("/api/nhomsanpham", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhomSanPham`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhóm:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint để lấy mã sản phẩm lớn nhất
productRouter.get("/api/sanpham/max-masanpham", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT TOP 1 MaSanPham
      FROM SanPham_Copy
      ORDER BY MaSanPham DESC
    `;

    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      const maxMaSanPham = result.recordset[0].MaSanPham;
      return res.json({ maxMaSanPham });
    } else {
      return res.json({ maxMaSanPham: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã sản phẩm lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng sản phẩm
productRouter.get("/api/sanpham", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT sp.*, nh.TenNhom
      FROM SanPham_Copy sp
      LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom;
    `;

    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
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
          WHERE sp.MaSanPham = @maSanPham
      `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      return res.json(result.recordset[0]);
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
      VALUES (@MaSanPham, @TenSanPham, @TrongLuong, @MoTaSanPham, @MaNhom);
    `;

    const request = new sql.Request();
    request.input("MaSanPham", sql.NVarChar, product.MaSanPham);
    request.input("TenSanPham", sql.NVarChar, product.TenSanPham);
    request.input("TrongLuong", sql.Float, product.TrongLuong);
    request.input("MoTaSanPham", sql.NVarChar, product.MoTaSanPham);
    request.input("MaNhom", sql.NVarChar, product.MaNhom);
    // request.input("GiaSanPham", sql.Decimal, product.GiaSanPham);
    // request.input("DonVi", sql.NVarChar, product.DonVi); // Lưu đơn vị cơ bản

    await request.query(sqlQuery);
    res.status(201).json({ message: "Sản phẩm đã được thêm thành công!" });
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    res.status(500).send("Lỗi khi thêm sản phẩm");
  }
});

// Cập nhật sản phẩm
productRouter.get("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const sqlQuery = `
      SELECT sp.*, nh.TenNhom
      FROM SanPham_Copy sp
      LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom
      WHERE sp.MaSanPham = @maSanPham;
    `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      const product = result.recordset[0];

      // Gửi sản phẩm mà không có các đơn vị bổ sung
      return res.json(product);
    } else {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return res.status(500).json({ message: "Lỗi khi lấy chi tiết sản phẩm" });
  }
});

// Xóa sản phẩm
productRouter.delete("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  try {
    const sqlQuery = `DELETE FROM SanPham_Copy WHERE MaSanPham = @maSanPham`;
    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Sản phẩm không tìm thấy.");
    }

    res.json({ message: "Sản phẩm đã được xóa thành công!" });
  } catch (err) {
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
      SET SoLuongTon = SoLuongTon + @SoLuong
      WHERE MaSanPham = @maSanPham
    `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);
    request.input("SoLuong", sql.Int, SoLuong);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Sản phẩm không tìm thấy.");
    }

    res.json({ message: "Số lượng tồn đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật số lượng tồn:", err);
    res.status(500).send("Lỗi khi cập nhật số lượng tồn");
  }
});

module.exports = productRouter;
