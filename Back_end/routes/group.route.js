const { Router } = require("express");
const sql = require("mssql"); // Import thư viện mssql

const groupRouter = new Router();

// Endpoint để lấy danh sách nhóm sản phẩm
groupRouter.get("/api/nhomsanpham", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhomSanPham`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho nhóm sản phẩm theo mã nhóm
groupRouter.get("/api/nhomsanpham/:maNhom", async (req, res) => {
  const maNhom = req.params.maNhom;

  try {
    const sqlQuery = `
          SELECT * FROM NhomSanPham
          WHERE MaNhom = @maNhom
      `;

    const request = new sql.Request();
    request.input("maNhom", sql.NVarChar, maNhom); // Sử dụng loại dữ liệu phù hợp

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      return res.json(result.recordset[0]); // Gửi nhóm sản phẩm đầu tiên
    } else {
      return res.status(404).json({ message: "Nhóm sản phẩm không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết nhóm sản phẩm:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy chi tiết nhóm sản phẩm" });
  }
});

// Endpoint thêm nhóm sản phẩm
groupRouter.post("/api/nhomsanpham", async (req, res) => {
  try {
    const { TenNhom, MoTa } = req.body;

    const sqlQuery = `
              INSERT INTO NhomSanPham (TenNhom, MoTa)
              VALUES (@TenNhom, @MoTa)
          `;

    const request = new sql.Request();

    request.input("TenNhom", sql.NVarChar, TenNhom);
    request.input("MoTa", sql.NVarChar, MoTa);

    await request.query(sqlQuery);

    res.status(201).json({ message: "Nhóm sản phẩm đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi thêm nhóm sản phẩm");
  }
});

// Endpoint cập nhật nhóm sản phẩm
groupRouter.put("/api/nhomsanpham/:maNhom", async (req, res) => {
  const maNhom = req.params.maNhom;
  const { TenNhom, MoTa } = req.body;

  try {
    const sqlQuery = `
          UPDATE NhomSanPham
          SET TenNhom = @TenNhom,
              MoTa = @MoTa
          WHERE MaNhom = @maNhom
      `;

    const request = new sql.Request();
    request.input("maNhom", sql.NVarChar, maNhom);
    request.input("TenNhom", sql.NVarChar, TenNhom);
    request.input("MoTa", sql.NVarChar, MoTa);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Nhóm sản phẩm không tìm thấy.");
    }

    res.json({ message: "Nhóm sản phẩm đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi cập nhật nhóm sản phẩm");
  }
});

// Endpoint xóa nhóm sản phẩm
groupRouter.delete("/api/nhomsanpham/:maNhom", async (req, res) => {
  const maNhom = req.params.maNhom;
  try {
    const sqlQuery = `DELETE FROM NhomSanPham WHERE MaNhom = @maNhom`;
    const request = new sql.Request();
    request.input("maNhom", sql.NVarChar, maNhom);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Nhóm sản phẩm không tìm thấy.");
    }

    res.json({ message: "Nhóm sản phẩm đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa nhóm sản phẩm:", err);
    res.status(500).send("Lỗi khi xóa nhóm sản phẩm");
  }
});

module.exports = groupRouter;
