const locationRoute = require("express").Router();
const sql = require("mssql");

locationRoute.get("/api/vitri", async (req, res) => {
  try {
    const sqlQuery = `
          SELECT * FROM ViTriKho
        `;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Đã có lỗi xảy ra");
  }
});

module.exports = locationRoute;
