const { Router } = require("express");
const sql = require("mssql");

const sheetRouter = new Router();

// Endpoint để lấy mã phiếu kiểm kê lớn nhất
sheetRouter.get("/api/phieukiemke/max-maphieu", async (req, res) => {
  try {
    const sqlQuery = `
        SELECT TOP 1 MaPhieuKiemKe
        FROM PhieuKiemKe
        ORDER BY MaPhieuKiemKe DESC
      `;
    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      const maxMaPhieuKiemKe = result.recordset[0].MaPhieuKiemKe;
      return res.json({ maxMaPhieuKiemKe });
    } else {
      return res.json({ maxMaPhieuKiemKe: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu kiểm kê lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng phiếu kiểm kê
sheetRouter.get("/api/phieukiemke", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT pk.*, nv.TenNhanVien
      FROM PhieuKiemKe pk
      LEFT JOIN NhanVien nv ON pk.MaNhanVien = nv.MaNhanVien;      
    `;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho chi tiết phiếu kiểm kê
sheetRouter.get("/api/phieukiemke/:maPhieuKiemKe", async (req, res) => {
  const { maPhieuKiemKe } = req.params;

  try {
    const request = new sql.Request();
    request.input("MaPhieuKiemKe", sql.NVarChar, maPhieuKiemKe);

    const result = await request.query(
      "SELECT * FROM PhieuKiemKe WHERE MaPhieuKiemKe = @MaPhieuKiemKe"
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu kiểm kê." });
    }

    // Lấy danh sách sản phẩm liên quan
    const productsResult = await request.query(
      "SELECT * FROM ChiTietPhieuKiemKe WHERE MaPhieuKiemKe = @MaPhieuKiemKe"
    );

    const responseData = {
      ...result.recordset[0],
      SanPhamList: productsResult.recordset, // Thêm danh sách sản phẩm vào phản hồi
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu kiểm kê:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu kiểm kê." });
  }
});

// Endpoint cho thêm phiếu kiểm kê
sheetRouter.post("/api/phieukiemke", async (req, res) => {
  console.log("Dữ liệu nhận được cho phiếu kiểm kê:", req.body); // Log dữ liệu
  try {
    const { MaPhieuKiemKe, MaNhanVien, NgayTao, MoTa, TenPhieu } = req.body;

    const sqlQuery = `
            INSERT INTO PhieuKiemKe (MaPhieuKiemKe, MaNhanVien, NgayTao, MoTa, TenPhieu)
            VALUES (@MaPhieuKiemKe, @MaNhanVien, @NgayTao, @MoTa, @TenPhieu)
        `;

    const request = new sql.Request();
    request.input("MaPhieuKiemKe", sql.NVarChar, MaPhieuKiemKe);
    request.input("MaNhanVien", sql.NVarChar, MaNhanVien);
    request.input("NgayTao", sql.DateTime, NgayTao);
    request.input("MoTa", sql.NVarChar, MoTa);
    request.input("TenPhieu", sql.NVarChar, TenPhieu);

    await request.query(sqlQuery);

    res.status(201).json({ MaPhieuKiemKe });
  } catch (err) {
    console.error("Lỗi khi thêm phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi thêm phiếu kiểm kê");
  }
});

sheetRouter.post("/api/chitietphieukiemke", async (req, res) => {
  console.log("Dữ liệu nhận được cho chi tiết phiếu kiểm kê:", req.body); // Log dữ liệu
  try {
    const { MaPhieuKiemKe, MaSanPham, SoLuongThucTe, MaDonVi } = req.body;

    const sqlQuery = `
            INSERT INTO ChiTietPhieuKiemKe (MaPhieuKiemKe, MaSanPham, SoLuongThucTe, MaDonVi)
            VALUES (@MaPhieuKiemKe, @MaSanPham, @SoLuongThucTe, @MaDonVi)
        `;

    const request = new sql.Request();
    request.input("MaPhieuKiemKe", sql.NVarChar, MaPhieuKiemKe);
    request.input("MaSanPham", sql.NVarChar, MaSanPham);
    request.input("SoLuongThucTe", sql.Int, SoLuongThucTe);
    request.input("MaDonVi", sql.NVarChar, MaDonVi);

    await request.query(sqlQuery);

    res.status(201).json({ MaPhieuKiemKe });
  } catch (err) {
    console.error("Lỗi khi thêm chi tiết phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi thêm chi tiết phiếu kiểm kê");
  }
});

// Endpoint xóa phiếu kiểm kê
sheetRouter.delete("/api/phieukiemke/:maPhieuKiemKe", async (req, res) => {
  const maPhieuKiemKe = req.params.maPhieuKiemKe;
  try {
    const sqlQuery = `DELETE FROM PhieuKiemKe WHERE MaPhieuKiemKe = @maPhieuKiemKe`;
    const request = new sql.Request();
    request.input("maPhieuKiemKe", sql.NVarChar, maPhieuKiemKe);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Phiếu kiểm kê không tìm thấy.");
    }

    res.json({ message: "Phiếu kiểm kê đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa phiếu kiểm kê:", err);
    res.status(500).send("Lỗi khi xóa phiếu kiểm kê");
  }
});

module.exports = sheetRouter;
