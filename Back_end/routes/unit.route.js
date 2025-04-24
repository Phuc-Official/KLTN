const { Router } = require("express");
const sql = require("mssql");

const unitRouter = new Router();

unitRouter.get("/api/donvitinh/:unitId", async (req, res) => {
  const unitId = req.params.unitId;

  try {
    const pool = await sql.connect(req.app.get("dbConfig")); // Lấy config từ app
    const request = new sql.Request(pool);
    request.input("MaDonVi", sql.NVarChar, unitId);

    const result = await request.query(
      "SELECT TyLeQuyDoi FROM DonViTinh WHERE MaDonVi = @MaDonVi"
    );

    if (result.recordset.length > 0) {
      res.json({ conversionRate: result.recordset[0].TyLeQuyDoi });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn vị tính." });
    }
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({ message: "Lỗi khi lấy tỷ lệ quy đổi." });
  }
});

// // API lấy danh sách tất cả đơn vị tính
// unitRouter.get("/api/donvitinh", async (req, res) => {
//   try {
//     const sqlQuery = `SELECT * FROM DonViTinh`;
//     const result = await sql.query(sqlQuery);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Lỗi khi lấy danh sách đơn vị tính:", err);
//     res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
//   }
// });

// Endpoint để thêm đơn vị tính khác
unitRouter.post("/api/donvitinhkhac", async (req, res) => {
  const unit = req.body;

  try {
    const sqlQuery = `
          INSERT INTO DonViKhac (MaSanPham, TenDonVi, TyLeQuyDoi, SoLuongTon)
          VALUES (@MaSanPham, @TenDonVi, @TyLeQuyDoi, @SoLuongTon);
      `;

    const request = new sql.Request();
    request.input("MaSanPham", sql.NVarChar, unit.MaSanPham);
    request.input("TenDonVi", sql.NVarChar, unit.TenDonVi);
    request.input("TyLeQuyDoi", sql.Decimal, unit.TyLeQuyDoi);
    request.input("SoLuongTon", sql.Int, unit.SoLuongTon);

    await request.query(sqlQuery);
    res.status(201).json({ message: "Đơn vị tính đã được thêm thành công!" });
  } catch (error) {
    console.error("Lỗi khi thêm đơn vị tính:", error);
    res.status(500).send("Lỗi khi thêm đơn vị tính");
  }
});

unitRouter.get("/api/donvitinhkhac/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const query = `
      SELECT *
      FROM DonViKhac
      WHERE MaSanPham = @maSanPham;
    `;

    const request = new sql.Request();
    request.input("maSanPham", sql.NVarChar, maSanPham);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      res.json(result.recordset);
    } else {
      res
        .status(404)
        .json({ message: "Không tìm thấy đơn vị tính cho mã sản phẩm này." });
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn:", error);
    return res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

unitRouter.get("/api/donvikhac/:maSanPham/:iD", async (req, res) => {
  const { maSanPham, iD } = req.params;

  try {
    // Kết nối đến cơ sở dữ liệu
    const pool = await sql.connect(req.app.get("dbConfig"));

    // Truy vấn để lấy tỷ lệ quy đổi
    const query = `
      SELECT TyLeQuyDoi 
      FROM DonViKhac 
      WHERE MaSanPham = @maSanPham AND ID = @iD`;

    const request = new sql.Request(pool);
    request.input("maSanPham", sql.NVarChar, maSanPham);
    request.input("iD", sql.NVarChar, iD);

    const result = await request.query(query);

    // Kiểm tra xem có kết quả không
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]); // Trả về tỷ lệ quy đổi
    } else {
      res.status(404).json({
        message: "Không tìm thấy tỷ lệ quy đổi cho sản phẩm và đơn vị này.",
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy tỷ lệ quy đổi:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu." });
  }
});

module.exports = unitRouter;
