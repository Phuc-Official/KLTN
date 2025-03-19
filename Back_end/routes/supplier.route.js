const { Router } = require("express");
const sql = require("mssql"); // Import thư viện mssql

const supplierRouter = new Router();

// Endpoint để lấy danh sách nhà cung cấp
supplierRouter.get("/api/nha-cung-cap", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhaCungCap`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhà cung cấp:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint lấy chi tiết nhà cung cấp
supplierRouter.get("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;

  try {
    const sqlQuery = `
            SELECT * FROM NhaCungCap
            WHERE MaNhaCungCap = @maNhaCungCap
        `;

    const request = new sql.Request();
    request.input("maNhaCungCap", sql.NVarChar, maNhaCungCap); // Sử dụng loại dữ liệu phù hợp

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      return res.json(result.recordset[0]); // Gửi nhà cung cấp đầu tiên
    } else {
      return res.status(404).json({ message: "Nhà cung cấp không tìm thấy" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết nhà cung cấp:", error);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy chi tiết nhà cung cấp" });
  }
});

// Endpoint thêm nhà cung cấp
supplierRouter.post("/api/nha-cung-cap", async (req, res) => {
  try {
    const {
      MaNhaCungCap,
      TenNhaCungCap,
      SoDienThoai,
      Email,
      MaSoThue,
      DiaChi,
    } = req.body;

    const sqlQuery = `
            INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, Email, MaSoThue, DiaChi)
            VALUES (@MaNhaCungCap, @TenNhaCungCap, @SoDienThoai, @Email, @MaSoThue, @DiaChi)
        `;

    const request = new sql.Request();
    request.input("MaNhaCungCap", sql.NVarChar, MaNhaCungCap);
    request.input("TenNhaCungCap", sql.NVarChar, TenNhaCungCap);
    request.input("SoDienThoai", sql.NVarChar, SoDienThoai);
    request.input("Email", sql.NVarChar, Email);
    request.input("MaSoThue", sql.NVarChar, MaSoThue);
    request.input("DiaChi", sql.NVarChar, DiaChi);

    await request.query(sqlQuery);

    res.status(201).json({ message: "Nhà cung cấp đã được thêm thành công!" });
  } catch (err) {
    console.error("Lỗi khi thêm nhà cung cấp:", err);
    res.status(500).send("Lỗi khi thêm nhà cung cấp");
  }
});

// Endpoint cập nhật nhà cung cấp
supplierRouter.put("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;
  const { TenNhaCungCap, SoDienThoai, Email, MaSoThue, DiaChi } = req.body;

  try {
    const sqlQuery = `
            UPDATE NhaCungCap
            SET TenNhaCungCap = @TenNhaCungCap,
                SoDienThoai = @SoDienThoai,
                Email = @Email,
                MaSoThue = @MaSoThue,
                DiaChi = @DiaChi
            WHERE MaNhaCungCap = @maNhaCungCap
        `;

    const request = new sql.Request();
    request.input("maNhaCungCap", sql.NVarChar, maNhaCungCap);
    request.input("TenNhaCungCap", sql.NVarChar, TenNhaCungCap);
    request.input("SoDienThoai", sql.NVarChar, SoDienThoai);
    request.input("Email", sql.NVarChar, Email);
    request.input("MaSoThue", sql.NVarChar, MaSoThue);
    request.input("DiaChi", sql.NVarChar, DiaChi);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Nhà cung cấp không tìm thấy.");
    }

    res.json({ message: "Nhà cung cấp đã được cập nhật thành công!" });
  } catch (err) {
    console.error("Lỗi khi cập nhật nhà cung cấp:", err);
    res.status(500).send("Lỗi khi cập nhật nhà cung cấp");
  }
});

// Endpoint xóa nhà cung cấp
supplierRouter.delete("/api/nha-cung-cap/:maNhaCungCap", async (req, res) => {
  const maNhaCungCap = req.params.maNhaCungCap;
  try {
    const sqlQuery = `DELETE FROM NhaCungCap WHERE MaNhaCungCap = @maNhaCungCap`;
    const request = new sql.Request();
    request.input("maNhaCungCap", sql.NVarChar, maNhaCungCap);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Nhà cung cấp không tìm thấy.");
    }

    res.json({ message: "Nhà cung cấp đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa nhà cung cấp:", err);
    res.status(500).send("Lỗi khi xóa nhà cung cấp");
  }
});

module.exports = supplierRouter;
