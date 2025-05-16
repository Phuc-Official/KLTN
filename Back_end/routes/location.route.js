const { Router } = require("express");
const pool = require("../db");

const locationRoute = new Router();

// 1. Lấy danh sách vị trí kho
locationRoute.get("/api/vitri", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM ViTriKho`;
    const [rows] = await pool.query(sqlQuery);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Đã có lỗi xảy ra");
  }
});

// 2. Lấy vị trí kho theo mã sản phẩm
locationRoute.get("/api/vitrikho/:maSanPham", async (req, res) => {
  const maSanPham = req.params.maSanPham;

  try {
    const query = `
      SELECT MaViTri, SoLuong, SucChua
      FROM ViTriKho
      WHERE MaSanPham = ?
    `;
    const [rows] = await pool.query(query, [maSanPham]);

    if (rows.length > 0) {
      res.json(rows);
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

// 3. Cập nhật số lượng vị trí kho
locationRoute.post("/api/capnhatsoluong", async (req, res) => {
  const { maSanPham, maViTri, soLuong } = req.body;
  console.log("Nhận yêu cầu cập nhật:", { maSanPham, maViTri, soLuong });

  if (!maSanPham || !maViTri || soLuong === undefined) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin cần thiết (maSanPham, maViTri hoặc soLuong).",
    });
  }

  try {
    // 1. Lấy thông tin hiện tại
    const getCurrentQuery = `
      SELECT SoLuong, SucChua
      FROM ViTriKho
      WHERE MaSanPham = ? AND MaViTri = ?
    `;

    const [currentRows] = await pool.query(getCurrentQuery, [
      maSanPham,
      maViTri,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vị trí kho cho sản phẩm này.",
      });
    }

    const currentQuantity = currentRows[0].SoLuong || 0;
    const capacity = currentRows[0].SucChua;

    const newQuantity = currentQuantity + soLuong;

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: `Số lượng không được âm. Hiện có: ${currentQuantity}, yêu cầu xuất: ${-soLuong}`,
        currentQuantity,
        requested: soLuong,
      });
    }

    if (newQuantity > capacity) {
      return res.status(400).json({
        success: false,
        message: `Vượt quá sức chứa (${capacity}). Số lượng sau cập nhật: ${newQuantity}`,
        currentQuantity,
        capacity,
        requested: soLuong,
      });
    }

    // 2. Cập nhật
    const updateQuery = `
      UPDATE ViTriKho
      SET SoLuong = ?
      WHERE MaSanPham = ? AND MaViTri = ?
    `;

    const [updateResult] = await pool.query(updateQuery, [
      newQuantity,
      maSanPham,
      maViTri,
    ]);

    // 3. Xác nhận cập nhật
    const [verifyRows] = await pool.query(getCurrentQuery, [
      maSanPham,
      maViTri,
    ]);

    res.status(200).json({
      success: true,
      message: "Cập nhật số lượng thành công",
      data: {
        previousQuantity: currentQuantity,
        newQuantity: verifyRows[0].SoLuong,
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

// 4. Thêm vị trí mới hoặc cập nhật vị trí nếu đã tồn tại
locationRoute.post("/api/themvitri", async (req, res) => {
  const { MaSanPham, Day, Ke, O, SucChua } = req.body;

  if (!MaSanPham || !Day || !Ke || !O || !SucChua) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SucChua <= 0) {
    return res.status(400).json({ message: "Sức chứa phải lớn hơn 0." });
  }

  try {
    const maViTri = `${Day}${Ke}-O${O}`;

    // Kiểm tra mã vị trí đã tồn tại chưa
    const checkQuery = `SELECT * FROM ViTriKho WHERE MaViTri = ?`;
    const [checkRows] = await pool.query(checkQuery, [maViTri]);

    if (checkRows.length > 0) {
      // Cập nhật
      const updateQuery = `
        UPDATE ViTriKho
        SET MaSanPham = ?, SucChua = ?
        WHERE MaViTri = ?
      `;
      await pool.query(updateQuery, [MaSanPham, SucChua, maViTri]);
      res
        .status(200)
        .json({ message: "Cập nhật thông tin vị trí thành công." });
    } else {
      // Nếu không tìm thấy vị trí, trả về lỗi (theo logic bạn cung cấp)
      return res
        .status(404)
        .json({ message: "Không tìm thấy vị trí với mã đã cho." });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật vị trí:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật vị trí." });
  }
});

// 5. Lấy số lượng hiện tại tại vị trí kho
locationRoute.get("/api/vitri/:maViTri/currentQuantity", async (req, res) => {
  const maViTri = req.params.maViTri;

  try {
    const query = `
      SELECT SoLuong
      FROM ViTriKho
      WHERE MaViTri = ?
    `;

    const [rows] = await pool.query(query, [maViTri]);

    if (rows.length > 0) {
      res.json({ SoLuong: rows[0].SoLuong });
    } else {
      res.status(404).json({ message: "Không tìm thấy vị trí kho." });
    }
  } catch (error) {
    console.error("Lỗi khi lấy số lượng tại vị trí kho:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy số lượng." });
  }
});

module.exports = locationRoute;
