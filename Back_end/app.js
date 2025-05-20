require("dotenv/config");
const express = require("express");
const cors = require("cors");

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
const employeeRouter = require("./routes/employee.route");
const stockRouter = require("./routes/stock.route");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use(employeeRouter);
app.use(stockRouter);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên http://localhost:${PORT}`);
});
