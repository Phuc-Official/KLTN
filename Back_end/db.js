const sql = require("mssql");

// Cấu hình kết nối
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

// Hàm kết nối
const connectToDatabase = async () => {
  try {
    console.log(config);
    await sql.connect(config);
    console.log("Kết nối thành công đến SQL Server");
  } catch (err) {
    console.error("Lỗi kết nối: ", err);
  }
};

// Xuất hàm kết nối
module.exports = {
  connectToDatabase,
  sql,
};
