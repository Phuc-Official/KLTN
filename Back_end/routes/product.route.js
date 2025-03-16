const { Router } = require("express");
const sql = require("mssql"); // Import thư viện mssql

const productRouter = new Router();

productRouter.get("/api/donhang", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM DonHang"); // Thay 'donhang' bằng tên bảng của bạn
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng sản phẩm
productRouter.get("/api/sanpham", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM SanPham"); // Thay 'sanpham' bằng tên bảng của bạn
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho thêm sản phẩm
productRouter.post("/api/sanpham", async (req, res) => {
  try {
    console.log(req.body);
    const {
      TenSanPham,
      MoTaSanPham,
      TrongLuong,
      DonViTinh,
      SoLuongTon,
      MaSKU,
    } = req.body;

    const sqlQuery = `
              INSERT INTO SanPham (TenSanPham, MoTaSanPham, TrongLuong, DonViTinh, SoLuongTon, MaSKU)
              VALUES (@TenSanPham, @MoTaSanPham, @TrongLuong, @DonViTinh, @SoLuongTon, @MaSKU)
          `;

    const request = new sql.Request();
    request.input("TenSanPham", sql.NVarChar, TenSanPham);
    request.input("MoTaSanPham", sql.NVarChar, TrongLuong);
    request.input("TrongLuong", sql.Decimal, TrongLuong);
    request.input("DonViTinh", sql.NVarChar, DonViTinh);
    request.input("SoLuongTon", sql.Int, SoLuongTon);
    request.input("MaSKU", sql.NVarChar, SoLuongTon);
    await request.query(sqlQuery);

    res.status(201).json({ message: "Sản phẩm đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm sản phẩm:", err);
    res.status(500).send("Lỗi khi thêm sản phẩm");
  }
});

module.exports = productRouter;
