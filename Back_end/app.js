require("dotenv/config");
const express = require("express");
const cors = require("cors");
const sql = require("mssql"); // Import thư viện mssql

const productRouter = require("./routes/product.route");
const supplierRouter = require("./routes/supplier.route");
const groupRouter = require("./routes/group.route");
const receiptRouter = require("./routes/receipt.route");
const receiptDetailRouter = require("./routes/receiptDetail.route");
const exportRouter = require("./routes/export.route");
const exportDetailRouter = require("./routes/exportDetail.route");
const sheetRouter = require("./routes/sheet.route");
const unitRouter = require("./routes/unit.route");
const orderRouter = require("./routes/order.route");
const orderDetailRouter = require("./routes/orderDetail.route");
const locationRoute = require("./routes/location.route");

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    port: Number(process.env.DB_PORT), // Chuyển đổi sang số
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Kết nối đến cơ sở dữ liệu
const connectToDatabase = async () => {
  try {
    await sql.connect(config);
    console.log("Kết nối thành công đến SQL Server");
  } catch (err) {
    console.error("Lỗi kết nối: ", err);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối đến cơ sở dữ liệu
connectToDatabase();

// Endpoint cho bảng đơn hàng
app.use(productRouter);
app.use(supplierRouter);
app.use(groupRouter);
app.use(receiptRouter);
app.use(receiptDetailRouter);
app.use(exportRouter);
app.use(exportDetailRouter);
app.use(sheetRouter);
app.use(unitRouter);
app.use(orderRouter);
app.use(orderDetailRouter);
app.use(locationRoute);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên http://localhost:${PORT}`);
});
