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

module.exports = unitRouter;
