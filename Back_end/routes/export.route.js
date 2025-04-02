const { Router } = require("express");
const sql = require("mssql");

const exportRouter = new Router();

// Endpoint để lấy danh sách khách hàng
exportRouter.get("/api/khachhang", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM KhachHang`;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khách hàng:", err);
    res.status(500).send("Lỗi khi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint để lấy mã phiếu xuất lớn nhất
exportRouter.get("/api/phieuxuat/max-maphieuxuat", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT TOP 1 MaPhieuXuat
      FROM PhieuXuat
      ORDER BY MaPhieuXuat DESC
    `;

    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      const maxMaPhieuXuat = result.recordset[0].MaPhieuXuat;
      return res.json({ maxMaPhieuXuat });
    } else {
      return res.json({ maxMaPhieuXuat: null });
    }
  } catch (err) {
    console.error("Lỗi khi lấy mã phiếu xuất lớn nhất:", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho bảng phiếu xuất
exportRouter.get("/api/phieuxuat", async (req, res) => {
  try {
    const sqlQuery = `
      SELECT px.*, kh.TenKhachHang, nv.TenNhanVien
      FROM PhieuXuat px
      LEFT JOIN KhachHang kh ON px.MaKhachHang = kh.MaKhachHang
      LEFT JOIN NhanVien nv ON px.MaNhanVien = nv.MaNhanVien;      
    `;
    const result = await sql.query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi truy vấn: ", err);
    res.status(500).send("Lỗi truy vấn cơ sở dữ liệu");
  }
});

// Endpoint cho chi tiết phiếu xuất
exportRouter.get("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const { maPhieuXuat } = req.params;

  try {
    const request = new sql.Request();
    request.input("MaPhieuXuat", sql.NVarChar, maPhieuXuat);

    const result = await request.query(
      "SELECT * FROM PhieuXuat WHERE MaPhieuXuat = @MaPhieuXuat"
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu xuất." });
    }

    // Lấy danh sách sản phẩm liên quan
    const productsResult = await request.query(
      "SELECT * FROM ChiTietPhieuXuat WHERE MaPhieuXuat = @MaPhieuXuat"
    );

    const responseData = {
      ...result.recordset[0],
      SanPhamList: productsResult.recordset, // Thêm danh sách sản phẩm vào phản hồi
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu xuất:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết phiếu xuất." });
  }
});

// Endpoint cho thêm phiếu xuất
exportRouter.post("/api/phieuxuat", async (req, res) => {
  try {
    const { MaPhieuXuat, MaKhachHang, MaNhanVien, NgayXuat, MoTa, TongGiaTri } =
      req.body;

    const sqlQuery = `
      INSERT INTO PhieuXuat (MaPhieuXuat, MaKhachHang, MaNhanVien, NgayXuat, MoTa, TongGiaTri)
      VALUES (@MaPhieuXuat, @MaKhachHang, @MaNhanVien, @NgayXuat, @MoTa, @TongGiaTri)
    `;

    const request = new sql.Request();
    request.input("MaPhieuXuat", sql.NVarChar, MaPhieuXuat);
    request.input("MaKhachHang", sql.NVarChar, MaKhachHang);
    request.input("MaNhanVien", sql.NVarChar, MaNhanVien);
    request.input("NgayXuat", sql.DateTime, NgayXuat);
    request.input("MoTa", sql.NVarChar, MoTa);
    request.input("TongGiaTri", sql.Decimal, TongGiaTri);

    await request.query(sqlQuery);

    res.status(201).json({ MaPhieuXuat }); // Trả về mã phiếu xuất
  } catch (err) {
    console.error("Lỗi khi thêm phiếu xuất:", err);
    res.status(500).send("Lỗi khi thêm phiếu xuất");
  }
});

// Cập nhật tổng giá trị phiếu xuất
exportRouter.put("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const { maPhieuXuat } = req.params;
  const { TongGiaTri } = req.body;

  try {
    const request = new sql.Request();
    request.input("TongGiaTri", sql.Decimal, TongGiaTri);
    request.input("MaPhieuXuat", sql.NVarChar, maPhieuXuat);

    await request.query(
      "UPDATE PhieuXuat SET TongGiaTri = @TongGiaTri WHERE MaPhieuXuat = @MaPhieuXuat"
    );

    res
      .status(200)
      .json({ message: "Tổng giá trị phiếu xuất đã được cập nhật." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật phiếu xuất." });
  }
});

// Endpoint xóa phiếu xuất
exportRouter.delete("/api/phieuxuat/:maPhieuXuat", async (req, res) => {
  const maPhieuXuat = req.params.maPhieuXuat;
  try {
    const sqlQuery = `DELETE FROM PhieuXuat WHERE MaPhieuXuat = @maPhieuXuat`;
    const request = new sql.Request();
    request.input("maPhieuXuat", sql.NVarChar, maPhieuXuat);

    const result = await request.query(sqlQuery);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Phiếu xuất không tìm thấy.");
    }

    res.json({ message: "Phiếu xuất đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa phiếu xuất:", err);
    res.status(500).send("Lỗi khi xóa phiếu xuất");
  }
});

module.exports = exportRouter;
