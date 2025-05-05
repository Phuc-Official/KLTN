const { Router } = require("express");
const sql = require("mssql");

const locationRoute = new Router();

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

locationRoute.get("/api/vitrikho/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    // Kết nối đến cơ sở dữ liệu
    const pool = await sql.connect(req.app.get("dbConfig"));

    // Truy vấn để lấy danh sách vị trí lưu trữ cùng với tỷ lệ quy đổi
    const query = `
      SELECT MaViTri, SoLuong, SucChua
      FROM ViTriKho 
     
      WHERE MaSanPham = @maSanPham`; // Sử dụng @maSanPham để tham số hóa

    const request = new sql.Request(pool);
    request.input("maSanPham", sql.NVarChar, maSanPham); // Sử dụng @maSanPham

    const result = await request.query(query);

    // Kiểm tra xem có kết quả không
    if (result.recordset.length > 0) {
      res.json(result.recordset);
    } else {
      res
        .status(404)
        .json({ message: "Không tìm thấy vị trí lưu trữ cho sản phẩm này." });
    }
  } catch (error) {
    console.error("Lỗi khi lấy vị trí lưu trữ:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu." });
  }
});

// API lấy danh sách vị trí lưu trữ theo mã sản phẩm
locationRoute.post("/api/capnhatsoluong", async (req, res) => {
  const { maSanPham, maViTri, soLuong } = req.body;
  console.log("Nhận yêu cầu cập nhật:", { maSanPham, maViTri, soLuong });

  // Kiểm tra đầu vào
  if (!maSanPham || !maViTri || soLuong === undefined) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin cần thiết (maSanPham, maViTri hoặc soLuong).",
    });
  }

  try {
    const pool = await sql.connect(req.app.get("dbConfig"));

    // 1. Lấy thông tin hiện tại
    const getCurrentQuery = `
      SELECT SoLuong, SucChua 
      FROM ViTriKho 
      WHERE MaSanPham = @maSanPham AND MaViTri = @maViTri`;

    const currentResult = await pool
      .request()
      .input("maSanPham", sql.NVarChar, maSanPham)
      .input("maViTri", sql.NVarChar, maViTri)
      .query(getCurrentQuery);

    if (currentResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vị trí kho cho sản phẩm này.",
      });
    }

    const currentQuantity = currentResult.recordset[0].SoLuong || 0;
    const capacity = currentResult.recordset[0].SucChua;

    // 2. Kiểm tra nghiệp vụ
    const newQuantity = currentQuantity + soLuong;

    // Kiểm tra số lượng âm (khi xuất hàng)
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: `Số lượng không được âm. Hiện có: ${currentQuantity}, yêu cầu xuất: ${-soLuong}`,
        currentQuantity,
        requested: soLuong,
      });
    }

    // Kiểm tra vượt sức chứa (khi nhập hàng)
    if (newQuantity > capacity) {
      return res.status(400).json({
        success: false,
        message: `Vượt quá sức chứa (${capacity}). Số lượng sau cập nhật: ${newQuantity}`,
        currentQuantity,
        capacity,
        requested: soLuong,
      });
    }

    // 3. Thực hiện cập nhật
    const updateQuery = `
      UPDATE ViTriKho 
      SET SoLuong = @newQuantity
      WHERE MaSanPham = @maSanPham AND MaViTri = @maViTri`;

    const updateResult = await pool
      .request()
      .input("maSanPham", sql.NVarChar, maSanPham)
      .input("maViTri", sql.NVarChar, maViTri)
      .input("newQuantity", sql.Int, newQuantity)
      .query(updateQuery);

    // 4. Lấy thông tin cập nhật cuối cùng để xác nhận
    const verifyResult = await pool
      .request()
      .input("maSanPham", sql.NVarChar, maSanPham)
      .input("maViTri", sql.NVarChar, maViTri)
      .query(getCurrentQuery);

    res.status(200).json({
      success: true,
      message: "Cập nhật số lượng thành công",
      data: {
        previousQuantity: currentQuantity,
        newQuantity: verifyResult.recordset[0].SoLuong,
        change: soLuong,
        capacity: capacity,
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật số lượng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật số lượng",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

locationRoute.post("/api/themvitri", async (req, res) => {
  const { MaSanPham, Day, Ke, O, SucChua } = req.body;

  if (!MaSanPham || !Day || !Ke || !O || !SucChua) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SucChua <= 0) {
    return res.status(400).json({ message: "Sức chứa phải lớn hơn 0." });
  }

  try {
    const pool = await sql.connect(req.app.get("dbConfig"));

    // Tạo mã vị trí
    const maViTri = `${Day}${Ke}-O${O}`;

    // Kiểm tra xem mã vị trí đã tồn tại chưa
    const checkRequest = new sql.Request(pool);
    checkRequest.input("MaViTri", sql.NVarChar, maViTri);
    const checkResult = await checkRequest.query(
      "SELECT * FROM ViTriKho WHERE MaViTri = @MaViTri"
    );

    if (checkResult.recordset.length > 0) {
      // Nếu đã tồn tại, cập nhật sức chứa và mã sản phẩm
      const updateRequest = new sql.Request(pool);
      updateRequest.input("MaViTri", sql.NVarChar, maViTri);
      updateRequest.input("MaSanPham", sql.NVarChar, MaSanPham);
      updateRequest.input("SucChua", sql.Int, SucChua);

      await updateRequest.query(`
        UPDATE ViTriKho 
        SET MaSanPham = @MaSanPham, SucChua = @SucChua 
        WHERE MaViTri = @MaViTri
      `);

      res
        .status(200)
        .json({ message: "Cập nhật thông tin vị trí thành công." });
    } else {
      // Nếu không tìm thấy mã vị trí, trả về thông báo lỗi
      return res
        .status(404)
        .json({ message: "Không tìm thấy vị trí với mã đã cho." });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật vị trí:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật vị trí." });
  }
});

locationRoute.get("/api/vitri/:maViTri/currentQuantity", async (req, res) => {
  const maViTri = req.params.maViTri;

  try {
    // Kết nối đến cơ sở dữ liệu
    const pool = await sql.connect(req.app.get("dbConfig"));

    // Truy vấn để lấy số lượng hiện có tại vị trí kho
    const query = `
      SELECT SoLuong 
      FROM ViTriKho 
      WHERE MaViTri = @maViTri`;

    const request = new sql.Request(pool);
    request.input("maViTri", sql.NVarChar, maViTri); // Sử dụng @maViTri để tham số hóa

    const result = await request.query(query);

    // Kiểm tra xem có kết quả không
    if (result.recordset.length > 0) {
      const soLuong = result.recordset[0].SoLuong;
      res.json({ SoLuong: soLuong });
    } else {
      res.status(404).json({ message: "Không tìm thấy vị trí kho." });
    }
  } catch (error) {
    console.error("Lỗi khi lấy số lượng tại vị trí kho:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy số lượng." });
  }
});

module.exports = locationRoute;
