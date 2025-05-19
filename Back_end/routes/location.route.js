const { Router } = require("express");
const pool = require("../db"); // pool MySQL đã setup sẵn

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

  if (!maSanPham || !maViTri || soLuong === undefined) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin cần thiết (maSanPham, maViTri hoặc soLuong).",
    });
  }

  try {
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

    const updateQuery = `
      UPDATE ViTriKho
      SET SoLuong = ?
      WHERE MaSanPham = ? AND MaViTri = ?
    `;

    await pool.query(updateQuery, [newQuantity, maSanPham, maViTri]);

    res.status(200).json({
      success: true,
      message: "Cập nhật số lượng thành công",
      data: {
        previousQuantity: currentQuantity,
        newQuantity,
        change: soLuong,
        capacity,
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
  const { MaSanPham, Day, Ke, O, SucChua, update } = req.body;

  if (!MaSanPham || !Day || !Ke || !O || !SucChua) {
    return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
  }

  if (SucChua <= 0) {
    return res.status(400).json({ message: "Sức chứa phải lớn hơn 0." });
  }

  try {
    const maViTri = `${Day}${Ke}-O${O}`;

    // Kiểm tra vị trí đã tồn tại
    const checkQuery = `SELECT * FROM ViTriKho WHERE MaViTri = ?`;
    const [checkRows] = await pool.query(checkQuery, [maViTri]);

    if (checkRows.length > 0) {
      const currentMaSP = checkRows[0].MaSanPham;

      // Nếu sản phẩm khác và chưa chọn cập nhật
      if (currentMaSP && currentMaSP !== MaSanPham && !update) {
        return res.status(409).json({
          message: `Vị trí ${maViTri} đã có sản phẩm khác (${currentMaSP}), bạn có muốn cập nhật không?`,
          exists: true,
          currentProduct: currentMaSP,
        });
      }

      // Cho phép cập nhật (dù sản phẩm khác) nếu update === true
      const updateQuery = `
        UPDATE ViTriKho
        SET MaSanPham = ?, SucChua = ?, SoLuong = 0
        WHERE MaViTri = ?
      `;

      await pool.query(updateQuery, [MaSanPham, SucChua, maViTri]);
      return res.status(200).json({ message: "Cập nhật vị trí thành công." });
    } else {
      // Thêm mới vị trí
      const insertQuery = `
        INSERT INTO ViTriKho (MaViTri, Day, Ke, O, SucChua, MaSanPham, SoLuong)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `;
      await pool.query(insertQuery, [maViTri, Day, Ke, O, SucChua, MaSanPham]);
      return res.status(201).json({ message: "Thêm vị trí thành công." });
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

// 6. Lấy vị trí kho theo mã vị trí (MaViTri)
locationRoute.get("/api/vitri/:maViTri", async (req, res) => {
  const { maViTri } = req.params;

  try {
    const sql = "SELECT * FROM ViTriKho WHERE MaViTri = ? LIMIT 1";
    const [results] = await pool.query(sql, [maViTri]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Vị trí không tồn tại" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu" });
  }
});

module.exports = locationRoute;
