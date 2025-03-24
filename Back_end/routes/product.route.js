const { Router } = require("express");
const sql = require("mssql"); // Import thư viện mssql

const productRouter = new Router();

// Endpoint để lấy danh sách đơn vị tính
productRouter.get("/api/donvitinh", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM DonViTinh`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đơn vị tính:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

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

// Endpoint cho bảng sản phẩm
productRouter.get("/api/sanpham", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT sp.*, nh.TenNhom
      FROM SanPham sp
      LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom;
    `;

    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng sản phẩm
productRouter.get("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const sqlQuery = `
          SELECT sp.*, nh.TenNhom, dv.TyleQuyDoi
          FROM SanPham sp
          LEFT JOIN NhomSanPham nh ON sp.MaNhom = nh.MaNhom
          LEFT JOIN DonViTinh dv ON sp.MaDonVi = dv.MaDonVi
          WHERE sp.MaSanPham = @maSanPham
      `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham); // Sử dụng loại dữ liệu phù hợp

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      return res.json(result.recordset[0]); // Gửi sản phẩm đầu tiên
    } else {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    return res.status(500).json({ message: "Lỗi khi lấy chi tiết sản phẩm" });
  }
});

// Endpoint cho thêm sản phẩm
productRouter.post("/api/sanpham", async (req, res) => {
  try {
    console.log(req.body);
    const {
      MaSanPham,
      TenSanPham,
      MoTaSanPham,
      TrongLuong,
      DonViTinh,
      SoLuongTon,
      SoLuongTonQuyDoi,
      MaDonVi,
      MaNhom,
    } = req.body;

    // Lấy MaNhom dựa trên TenNhom
    // const sqlQueryNhom = `SELECT MaNhom FROM NhomSanPham WHERE TenNhom = @TenNhom`;
    // const requestNhom = new sql.Request();
    // requestNhom.input("TenNhom", sql.NVarChar, TenNhom);
    // const resultNhom = await requestNhom.query(sqlQueryNhom);

    // if (resultNhom.recordset.length === 0) {
    //   return res.status(400).json({ message: "Nhóm sản phẩm không tồn tại." });
    // }

    const sqlQuery = `
      INSERT INTO SanPham (MaSanPham, TenSanPham, MoTaSanPham, TrongLuong, DonViTinh, SoLuongTon, SoLuongTonQuyDoi, MaDonVi, MaNhom)
      VALUES (@MaSanPham, @TenSanPham, @MoTaSanPham, @TrongLuong, @DonViTinh, @SoLuongTon, @SoLuongTonQuyDoi, @MaDonVi, @MaNhom)
    `;

    const request = new sql.Request();
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("TenSanPham", sql.NVarChar, TenSanPham);
    request.input("MoTaSanPham", sql.NVarChar, MoTaSanPham);
    request.input("TrongLuong", sql.Decimal, TrongLuong);
    request.input("DonViTinh", sql.NVarChar, DonViTinh);
    request.input("SoLuongTon", sql.Int, SoLuongTon);
    request.input("SoLuongTonQuyDoi", sql.NVarChar, SoLuongTonQuyDoi);
    request.input("MaDonVi", sql.NVarChar, MaDonVi);
    request.input("MaNhom", sql.Int, MaNhom);

    await request.query(sqlQuery);

    res.status(201).json({ message: "Sản phẩm đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    res.status(500).send("Lỗi khi thêm sản phẩm");
  }
});

productRouter.put("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  const { TenSanPham, MoTaSanPham, TrongLuong, DonViTinh, SoLuongTon, MaSKU } =
    req.body;

  try {
    const sqlQuery = `
          UPDATE SanPham
          SET TenSanPham = @TenSanPham,
              MoTaSanPham = @MoTaSanPham,
              TrongLuong = @TrongLuong,
              DonViTinh = @DonViTinh,
              SoLuongTon = @SoLuongTon,
              DonViQuyDoi = @DonViQuyDoi
          WHERE MaSanPham = @maSanPham
      `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);
    request.input("TenSanPham", sql.NVarChar, TenSanPham);
    request.input("MoTaSanPham", sql.NVarChar, MoTaSanPham);
    request.input("TrongLuong", sql.Decimal, TrongLuong);
    request.input("DonViTinh", sql.NVarChar, DonViTinh);
    request.input("SoLuongTon", sql.Int, SoLuongTon);
    request.input("DonViQuyDoi", sql.NVarChar, DonViQuyDoi);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Sản phẩm không tìm thấy.");
    }

    res.json({ message: "Sản phẩm đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật sản phẩm:", err);
    res.status(500).send("Lỗi khi cập nhật sản phẩm");
  }
});

productRouter.delete("/api/sanpham/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;
  try {
    const sqlQuery = `DELETE FROM SanPham WHERE MaSanPham = @maSanPham`;
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

module.exports = productRouter;
