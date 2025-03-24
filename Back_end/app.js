require("dotenv/config");
const express = require("express");
const cors = require("cors");
const sql = require("mssql"); // Import thư viện mssql

const productRouter = require("./routes/product.route");
const supplierRouter = require("./routes/supplier.route");
const groupRouter = require("./routes/group.route");

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    port: 1433,
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

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên http://localhost:${PORT}`);
});
