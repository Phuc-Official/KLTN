const { Router } = require("express");
const sql = require("mssql");

const receiptRouter = new Router();

// Endpoint để lấy danh sách nhà cung cấp
receiptRouter.get("/api/nhacungcap", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhaCungCap`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhà cung cấp:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

receiptRouter.get("/api/nhanvien", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM NhanVien`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint để lấy mã phiếu nhập lớn nhất
receiptRouter.get("/api/phieunhap/max-maphieunhap", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT TOP 1 MaPhieuNhap
      FROM PhieuNhap_Copy
      ORDER BY MaPhieuNhap DESC
    `;

    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      const maxMaPhieuNhap = result.recordset[0].MaPhieuNhap;
      return res.json({ maxMaPhieuNhap });
    } else {
      return res.json({ maxMaPhieuNhap: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu nhập lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng phiếu nhập
receiptRouter.get("/api/phieunhap", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT pn.*, nc.TenNhaCungCap, nv.TenNhanVien
      FROM PhieuNhap_Copy pn
      LEFT JOIN NhaCungCap nc ON pn.MaNhaCungCap = nc.MaNhaCungCap
      LEFT JOIN NhanVien nv ON pn.MaNhanVien = nv.MaNhanVien;      
    `;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho chi tiết phiếu nhập
// receiptRouter.get("/api/phieunhap/:maPhieuNhap", async (req, res) => {
//   const maPhieuNhap = req.params.maPhieuNhap;

//   try {
//     const sqlQuery = `
//       SELECT pn.*, nc.TenNhaCungCap
//       FROM PhieuNhap_Copy pn
//       LEFT JOIN NhaCungCap nc ON pn.MaNhaCungCap = nc.MaNhaCungCap

//       WHERE pn.MaPhieuNhap = @maPhieuNhap
//     `;

//     // , nv.TenNhanVien
//     // LEFT JOIN NhanVien nv ON pn.MaNhanVien = nv.MaNhanVien

//     const request = new sql.Request();
//     request.input("maPhieuNhap", sql.NVarChar, maPhieuNhap);

//     const result = await request.query(sqlQuery);

//     if (result.recordset.length > 0) {
//       return res.json(result.recordset[0]);
//     } else {
//       return res.status(404).json({ message: "Phiếu nhập không tìm thấy" });
//     }
//   } catch (error) {
//     console.error("Lỗi khi lấy chi tiết phiếu nhập:", error);
//     return res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu nhập" });
//   }
// });

// Endpoint cho chi tiết phiếu nhập
receiptRouter.get("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const { maPhieuNhap } = req.params;

  try {
    const request = new sql.Request();
    request.input("MaPhieuNhap", sql.NVarChar, maPhieuNhap);

    const result = await request.query(
      "SELECT * FROM PhieuNhap_Copy WHERE MaPhieuNhap = @MaPhieuNhap"
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu nhập." });
    }

    // Lấy danh sách sản phẩm liên quan
    const productsResult = await request.query(
      "SELECT * FROM ChiTietPhieuNhap WHERE MaPhieuNhap = @MaPhieuNhap"
    );

    const responseData = {
      ...result.recordset[0],
      SanPhamList: productsResult.recordset, // Thêm danh sách sản phẩm vào phản hồi
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu nhập:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu nhập." });
  }
});

// Endpoint cho thêm phiếu nhập

receiptRouter.post("/api/phieunhap", async (req, res) => {
  try {
    const {
      MaPhieuNhap,
      MaNhaCungCap,
      MaNhanVien,
      NgayNhap,
      MoTa,
      TongGiaTri,
    } = req.body;

    const sqlQuery = `
      INSERT INTO PhieuNhap_Copy (MaPhieuNhap, MaNhaCungCap, MaNhanVien, NgayNhap, MoTa, TongGiaTri)
      VALUES (@MaPhieuNhap, @MaNhaCungCap, @MaNhanVien, @NgayNhap, @MoTa, @TongGiaTri)
    `;

    const request = new sql.Request();
    request.input("MaPhieuNhap", sql.NVarChar, MaPhieuNhap);
    request.input("MaNhaCungCap", sql.NVarChar, MaNhaCungCap);
    request.input("MaNhanVien", sql.NVarChar, MaNhanVien);
    request.input("NgayNhap", sql.DateTime, NgayNhap);
    request.input("MoTa", sql.NVarChar, MoTa);
    request.input("TongGiaTri", sql.Decimal, TongGiaTri);

    await request.query(sqlQuery);

    res.status(201).json({ MaPhieuNhap }); // Trả về mã phiếu nhập
  } catch (err) {
    console.error("Lỗi khi thêm phiếu nhập:", err);
    res.status(500).send("Lỗi khi thêm phiếu nhập");
  }
});

// Cập nhật tổng giá trị phiếu nhập
receiptRouter.put("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const { maPhieuNhap } = req.params;
  const { TongGiaTri } = req.body;

  try {
    const request = new sql.Request();
    request.input("TongGiaTri", sql.Decimal, TongGiaTri);
    request.input("MaPhieuNhap", sql.NVarChar, maPhieuNhap);

    await request.query(
      "UPDATE PhieuNhap SET TongGiaTri = @TongGiaTri WHERE MaPhieuNhap = @MaPhieuNhap"
    );

    res
      .status(200)
      .json({ message: "Tổng giá trị phiếu nhập đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật phiếu nhập." });
  }
});

// Endpoint xóa phiếu nhập
receiptRouter.delete("/api/phieunhap/:maPhieuNhap", async (req, res) => {
  const maPhieuNhap = req.params.maPhieuNhap;
  try {
    const sqlQuery = `DELETE FROM PhieuNhap WHERE MaPhieuNhap = @maPhieuNhap`;
    const request = new sql.Request();
    request.input("maPhieuNhap", sql.NVarChar, maPhieuNhap);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Phiếu nhập không tìm thấy.");
    }

    res.json({ message: "Phiếu nhập đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa phiếu nhập:", err);
    res.status(500).send("Lỗi khi xóa phiếu nhập");
  }
});

module.exports = receiptRouter;
