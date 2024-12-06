// app.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const PORT = 3001;


// 引入 authRoutes
const authRoutes = require('./routes/authRoutes');
//初始化数据库
const { createTable } = require('./dbInit');

// 初始化 CSRF 保护
const csrfProtection = csurf({ cookie: true });

// 使用中间件
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// 静态文件服务配置 - 放在 CSRF 之前
app.use(express.static(path.join(__dirname, 'public')));

app.use(csrfProtection); // CSRF 保护应在所有路由之前

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// 创建数据库表
createTable(); // 调用创建表的函数



// 示例路由（确保这些路由在静态文件中间件之后）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// 引入认证中间件
const { authenticateToken } = require('./middleware/authenticate');


// 导入首页面板的路由
const dashboardRouter = require('./routes/dashboard');

// 导入添加号码的路由
const dashboardSectionRouter = require('./routes/dashboardSection');

// 导入 fetchContent 路由
const fetchContentRouter = require('./routes/fetchContent');
// 导入 fetchHistory 路由
const fetchHistoryRouter = require('./routes/fetchHistory');
// 导入 6肖6码 路由
const combinedDataRouter = require('./routes/combinedData');
// 导入 latestResult 路由
const latestResultRouter = require('./routes/latestResult');
// 导入 获取号码属性 路由
const numberInfoRouter = require('./routes/numberInfo');
// 引入删除记录路由
const deleteRecordRouter = require('./routes/deleteRecord');

// 使用认证路由
app.use('/', authRoutes); // 登录和退出登录路由

// 使用 首页面板 路由
app.use('/', dashboardRouter);
// 使用 fetchContent 路由
app.use('/', fetchContentRouter);
// 使用 fetchHistory 路由
app.use('/', fetchHistoryRouter);
// 使用 6肖6码 路由
app.use('/', combinedDataRouter);
// 使用 latestResult 路由
app.use('/', latestResultRouter);
// 使用添加号码的路由
app.use('/', dashboardSectionRouter);
// 使用删除号码的路由
app.use('/', deleteRecordRouter);
// 使用获取号码属性的路由
app.use('/', numberInfoRouter);



// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
