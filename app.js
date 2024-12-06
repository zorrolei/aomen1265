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
const SECRET_KEY = 'aB3dE5fG7hI9jK1mN2oP3qR4sT5uV6wXn';

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

// 初始化数据库
const db = new sqlite3.Database('./records.db', (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
  } else {
    console.log('成功连接到 SQLite 数据库');
  }
});



// 示例路由（确保这些路由在静态文件中间件之后）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// 创建表（如果尚未存在）
db.run(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL,
    numbers TEXT NOT NULL DEFAULT '[]',
    drawTime TEXT NOT NULL,
    section TEXT,
    randomZodiacs TEXT
  )
`, (err) => {
  if (err) {
    console.error('创建表失败:', err.message);
  } else {
    console.log('表 records 已创建或已存在');
  }
});

// 模拟用户数据
const adminUser = {
  username: 'admin',
  password: bcrypt.hashSync('$9Xv@3#Lm!Qw%5Z&', 10), // 加密密码
};

// 号码属性计算函数（请确保该函数已正确定义）
function getNumberAttributes(number) {
  const numberInt = parseInt(number, 10); // 用于属性计算
  const zodiacMap = {
    '鼠': [5, 17, 29, 41],
    '牛': [4, 16, 28, 40],
    '虎': [3, 15, 27, 39],
    '兔': [2, 14, 26, 38],
    '龙': [1, 13, 25, 37, 49],
    '蛇': [12, 24, 36, 48],
    '马': [11, 23, 35, 47],
    '羊': [10, 22, 34, 46],
    '猴': [9, 21, 33, 45],
    '鸡': [8, 20, 32, 44],
    '狗': [7, 19, 31, 43],
    '猪': [6, 18, 30, 42]
  };

  const elementMap = {
    '金': [2, 3, 10, 11, 24, 25, 32, 33, 40, 41],
    '木': [6, 7, 14, 15, 22, 23, 36, 37, 44, 45],
    '水': [12, 13, 20, 21, 28, 29, 42, 43],
    '火': [1, 8, 9, 16, 17, 30, 31, 38, 39, 46, 47],
    '土': [4, 5, 18, 19, 26, 27, 34, 35, 48, 49]
  };

  const colorMap = {
    '红波': [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46],
    '蓝波': [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48],
    '绿波': [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]
  };

  const sumParityMap = {
    '合数单': [1, 3, 5, 7, 9, 10, 12, 14, 16, 18, 21, 23, 25, 27, 29, 30, 32, 34, 36, 38, 41, 43, 45, 47, 49],
    '合数双': [2, 4, 6, 8, 11, 13, 15, 17, 19, 20, 22, 24, 26, 28, 31, 33, 35, 37, 39, 40, 42, 44, 46, 48]
  };

  let zodiac, element, color, sumParity;

  for (const [key, nums] of Object.entries(zodiacMap)) {
    if (nums.includes(numberInt)) {
      zodiac = key;
      break;
    }
  }

  for (const [key, nums] of Object.entries(elementMap)) {
    if (nums.includes(numberInt)) {
      element = key;
      break;
    }
  }

  for (const [key, nums] of Object.entries(colorMap)) {
    if (nums.includes(numberInt)) {
      color = key;
      break;
    }
  }

  for (const [key, nums] of Object.entries(sumParityMap)) {
    if (nums.includes(numberInt)) {
      sumParity = key;
      break;
    }
  }

  return {
    number: number, // 保留原始字符串形式的号码
    zodiac,
    element,
    color,
    sumParity
  };
}

// 根据颜色类别返回 CSS 类名
function getClassForColor(color) {
  switch (color) {
    case '红波':
      return 'redBoClass';
    case '蓝波':
      return 'blueBoClass';
    case '绿波':
      return 'greenBoClass';
    default:
      return '';
  }
}
// 定义所有生肖
const allZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 函数：生成随机的6个不重复生肖
function generateRandomZodiacs(count = 6) {
  const shuffled = allZodiacs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}



// 验证 JWT 的中间件
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) return res.redirect('/login');

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
};


// 登录页面
app.get('/login', (req, res) => {
  res.render('login', { error: null, csrfToken: req.csrfToken() });
});

// 登录处理
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === adminUser.username && bcrypt.compareSync(password, adminUser.password)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    return res.redirect('/dashboard');
  }

  res.render('login', { error: '用户名或密码错误', csrfToken: req.csrfToken() });
});

// 管理页面
app.get('/dashboard', authenticateToken, (req, res) => {
  // 获取分页参数，默认每页显示10条记录
  const pageSize = 10;

  // 获取每个区域的当前页码，从查询参数中获取，默认为第1页
  const page1 = parseInt(req.query.page1) || 1;
  const page2 = parseInt(req.query.page2) || 1;
  const page3 = parseInt(req.query.page3) || 1;

  db.all('SELECT * FROM records ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('数据库查询失败:', err);
      return res.status(500).send('数据库查询失败');
    }
    const records = rows.map(record => {
      let parsedNumbers;
      try {
        parsedNumbers = JSON.parse(record.numbers);
        if (!Array.isArray(parsedNumbers)) {
          throw new Error('Numbers is not an array');
        }
      } catch (e) {
        console.error(`解析 record.id=${record.id} 的 numbers 失败:`, e);
        parsedNumbers = []; // 设置为默认空数组
      }
      return {
        ...record,
        numbers: parsedNumbers
      };
    });

    // 将 records 按照 section 分类
    const recordsSection1 = records.filter(record => record.section === '1');
    const recordsSection2 = records.filter(record => record.section === '2');
    const recordsSection3 = records.filter(record => record.section === '3');

    // 计算每个区域的总页数
    const totalPages1 = Math.ceil(recordsSection1.length / pageSize);
    const totalPages2 = Math.ceil(recordsSection2.length / pageSize);
    const totalPages3 = Math.ceil(recordsSection3.length / pageSize);

    // 获取每个区域当前页的数据
    const paginatedRecordsSection1 = recordsSection1.slice((page1 - 1) * pageSize, page1 * pageSize);
    const paginatedRecordsSection2 = recordsSection2.slice((page2 - 1) * pageSize, page2 * pageSize);
    const paginatedRecordsSection3 = recordsSection3.slice((page3 - 1) * pageSize, page3 * pageSize);

    // 将分页信息传递给模板
    res.render('dashboard', {
      error: null,
      csrfToken: req.csrfToken(),
      recordsSection1: paginatedRecordsSection1,
      recordsSection2: paginatedRecordsSection2,
      recordsSection3: paginatedRecordsSection3,
      pagination: {
        section1: { currentPage: page1, totalPages: totalPages1 },
        section2: { currentPage: page2, totalPages: totalPages2 },
        section3: { currentPage: page3, totalPages: totalPages3 },
      }
    });
  });
});



// 获取号码属性
app.get('/number-info/:number', authenticateToken, (req, res) => {
  const number = req.params.number;
  const attributes = getNumberAttributes(number);
  res.json(attributes);
});


// 添加开奖结果 - 处理所有区域
app.post('/dashboard/section/:sectionId', authenticateToken, (req, res) => {
  let { period, numbers, drawTime } = req.body;
  const sectionId = req.params.sectionId; // 获取区域ID

  // 打印接收到的数据
  console.log(`Received data for section ${sectionId}:`, { period, numbers, drawTime });

  // 处理 numbers，确保它是一个包含 7 个号码的数组
  let numbersArray = [];

  if (Array.isArray(numbers)) {
    numbersArray = numbers.map(num => num.trim().padStart(2, '0')).filter(num => num !== '');
  } else if (typeof numbers === 'string') {
    numbersArray = numbers.split(',').map(num => num.trim().padStart(2, '0')).filter(num => num !== '');
  }

  if (!period || !numbersArray || numbersArray.length !== 7 || !drawTime) {
    return db.all('SELECT * FROM records ORDER BY id DESC', [], (err, rows) => {
      if (err) {
        return res.status(500).send('数据库查询失败');
      }
      const records = rows.map(record => ({
        ...record,
        numbers: JSON.parse(record.numbers)
      }));
      res.render('dashboard', {
        error: '请填写完整的信息，并确保提交了7个号码',
        records,
        csrfToken: req.csrfToken()
      });
    });
  }

  // 将 drawTime 转换为 UTC ISO 字符串
  let drawTimeUTC;
  try {
    drawTimeUTC = new Date(drawTime).toISOString();
  } catch (e) {
    console.error('Invalid drawTime format:', e);
    return res.status(400).send('无效的 drawTime 格式');
  }

  const numbersWithAttributes = numbersArray.map(num => getNumberAttributes(num));

  // 生成6个随机生肖
  let randomZodiacs
  try {
    randomZodiacs = generateRandomZodiacs(6);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }


  // 在数据库中存储区域信息
  db.run(
      'INSERT INTO records (period, numbers, drawTime, section, randomZodiacs) VALUES (?, ?, ?, ?, ?)',
      [period, JSON.stringify(numbersWithAttributes), drawTimeUTC, sectionId, JSON.stringify(randomZodiacs)],
      function (err) {
        if (err) {
          console.error('数据库写入失败:', err);
          return res.status(500).send('数据库写入失败');
        }
        console.log(`已插入记录ID=${this.lastID} (区域 ${sectionId})`);
        res.redirect('/dashboard');
      }
  );
});


// 删除记录的路由
app.post('/delete-record', authenticateToken, (req, res) => {
  const { id } = req.body;

  if (!id) {
    console.error('删除请求缺少记录ID');
    return res.status(400).send('删除请求缺少记录ID');
  }

  db.run('DELETE FROM records WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(`删除记录失败: ${err.message}`);
      return res.status(500).send('删除记录失败');
    }

    if (this.changes === 0) {
      console.warn(`未找到ID=${id}的记录`);
      return res.status(404).send('未找到要删除的记录');
    }

    console.log(`记录ID=${id}已删除`);
    res.redirect('/dashboard');
  });
});

// 最新开奖结果的 API 端点
app.get('/latest-result', (req, res) => {
  const section = req.query.section || '1';
  // 使用 UTC 时间进行比较
  const currentTime = new Date();
  
  db.get('SELECT * FROM records WHERE drawTime <= ? AND section = ? ORDER BY drawTime DESC LIMIT 1', 
    [currentTime.toISOString(), section], 
    (err, currentRecord) => {
      if (err) {
        console.error('查询当前记录失败:', err.message);
        return res.status(500).json({ error: '查询当前记录失败' });
      }

      if (!currentRecord) {
        return res.status(404).json({ error: '没有当前记录' });
      }

      // 查询下一期开奖时间
      db.get('SELECT drawTime FROM records WHERE drawTime > ? AND section = ? ORDER BY drawTime ASC LIMIT 1',
        [currentTime.toISOString(), section],
        (err, nextRow) => {
          if (err) {
            console.error('查询下一期开奖时间失败:', err.message);
            return res.status(500).json({ error: '查询下一期开奖时间失败' });
          }

          let numbersWithAttributes = [];
          try {
            numbersWithAttributes = JSON.parse(currentRecord.numbers);
          } catch (e) {
            console.error('解析号码失败:', e);
          }

          const ballRevealTimes = [120000, 130000, 140000, 150000, 160000, 170000, 180000]; // 每个球的揭晓时间
          const totalRevealTime = 180000; // 所有球揭晓完的总时间

          // 解析数据库中的时间为 Date 对象
          const drawDate = new Date(currentRecord.drawTime);
          // 计算已过去的时间（毫秒）
          const timeElapsed = currentTime.getTime() - drawDate.getTime();

          const specialWords = [
            '澳<br>与',
            '门<br>官',
            '全<br>方',
            '民<br>网',
            '彩<br>同',
            '开<br>步',
            '奖<br>中'
          ];

          const data = {};
          for (let i = 0; i < 7; i++) {
            const item = numbersWithAttributes[i];
            const num = item ? item.number : '';
            const className = item ? getClassForColor(item.color) : '';

            if (timeElapsed >= ballRevealTimes[i]) {
              // 已揭晓的号码
              data[i + 1] = {
                tit: num,
                wx: item.element || '',
                tit0: item.zodiac || '',
                class: className,
                isRevealed: true
              };
            } else {
              // 未揭晓的号码，返回特殊文字
              data[i + 1] = {
                specialWord: specialWords[i],
                class: 'redBoClass',
                isRevealed: false
              };
            }
          }

          // 确定状态和倒计时时间
          let status;
          let countdownTime;

          if (timeElapsed < 0) {
            // 还未到开奖时间
            status = 'countdown';
            countdownTime = drawDate.getTime();
          } else if (timeElapsed >= 0 && timeElapsed < totalRevealTime) {
            // 正在开奖中
            status = 'drawing';
            countdownTime = null;
          } else {
            // 开奖已结束，准备下一期
            status = 'finished';
            if (nextRow) {
              const nextDrawTime = new Date(nextRow.drawTime);
              countdownTime = nextDrawTime.getTime();
            } else {
              // 如果没有下一期记录，设置为24小时后
              const nextDay = new Date(currentTime);
              nextDay.setDate(nextDay.getDate() + 1);
              countdownTime = nextDay.getTime();
            }
          }

          // 返回响应时包含更多的时间信息以便调试
          res.json({
            current: {
              period: currentRecord.period,
              drawTime: drawDate.toISOString(),
              data: data
            },
            status: status,
            countdown: countdownTime,
            serverTime: currentTime.getTime(),
            debug: {
              currentTimeISO: currentTime.toISOString(),
              drawTimeISO: drawDate.toISOString(),
              timeElapsed: timeElapsed,
              timeElapsedMinutes: Math.floor(timeElapsed / (1000 * 60))
            }
          });
        });
    });
});





// 获取指定分类的历史记录
// 获取指定分类的历史记录
app.get('/history', (req, res) => {
  const section = req.query.section || '1'; // 默认分类为 1

  const currentTime = new Date();

  // 查询指定分类的最后一条已开奖的记录（drawTime <= currentTime
  db.get('SELECT * FROM records WHERE drawTime <= ? AND section = ? ORDER BY drawTime DESC LIMIT 1', [currentTime.toISOString(), section], (err, lastRecord) => {
    if (err) {
      // console.error('查询最后一条记录失败:', err.message);
      return res.status(500).json({ error: '查询最后一条记录失败' });
    }

    // 如果没有已开奖的记录，返回404
    if (!lastRecord) {
      return res.status(404).json({ error: '没有历史记录' });
    }

    const lastDrawTime = new Date(lastRecord.drawTime).getTime();
    const waitTime = lastDrawTime + 3 * 60 * 1000; // 加三分钟
    const currentTimeInMillis = currentTime.getTime(); // 当前时间的毫秒表示

    // 如果当前时间小于等待时间，返回早于最后开奖的历史记录
    if (currentTimeInMillis < waitTime) {
      db.all('SELECT * FROM records WHERE section = ? AND drawTime < ? ORDER BY drawTime DESC', [section, lastRecord.drawTime], (err, rows) => {
        if (err) {
          console.error('查询历史记录失败:', err.message);
          return res.status(500).json({ error: '查询历史记录失败' });
        }

        if (rows.length === 0) {
          return res.status(404).json({ error: '没有历史记录' });
        }

        // 处理每一条记录，解析 numbers 字段
        const records = rows.map(record => {
          let numbersWithAttributes = [];
          try {
            numbersWithAttributes = JSON.parse(record.numbers);
          } catch (e) {
            console.error('解析号码失败:', e);
          }

          // 为每个号码添加 class 属性
          numbersWithAttributes = numbersWithAttributes.map(item => {
            const className = getClassForColor(item.color);
            return {
              ...item,
              class: className
            };
          });

          return {
            period: record.period,
            drawTime: record.drawTime,
            numbers: numbersWithAttributes
          };
        });

        res.json({ records });
      });
    } else {
      // 当前时间已超过最后一条记录的开奖时间，返回所有历史记录，包括最后一条记录
      db.all('SELECT * FROM records WHERE section = ? AND drawTime <= ? ORDER BY drawTime DESC', [section, currentTime.toISOString()], (err, rows) => {
        if (err) {
          console.error('查询历史记录失败:', err.message);
          return res.status(500).json({ error: '查询历史记录失败' });
        }

        // 处理所有记录并返回
        const records = rows.map(record => {
          let numbersWithAttributes = [];
          try {
            numbersWithAttributes = JSON.parse(record.numbers);
          } catch (e) {
            console.error('解析号码失败:', e);
          }

          // 为每个号码添加 class 属性
          numbersWithAttributes = numbersWithAttributes.map(item => {
            const className = getClassForColor(item.color);
            return {
              ...item,
              class: className
            };
          });

          return {
            period: record.period,
            drawTime: record.drawTime,
            numbers: numbersWithAttributes
          };
        });

        res.json({ records });
      });
    }
  });
});

// 6肖6码接口 端点：获取前4条历史记录和当前记录（无需验证）
app.get('/combined-data', (req, res) => {
  const section = req.query.section || '1';
  const currentTime = new Date();

  // 查询 4 条历史记录（已开奖）
  const historicalQuery = `
    SELECT * FROM records
    WHERE drawTime <= ? AND section = ?
    ORDER BY drawTime DESC
      LIMIT 9
  `;

  db.all(historicalQuery, [currentTime.toISOString(), section], (err, historicalRecords) => {
    if (err) {
      console.error('查询历史记录失败:', err.message);
      return res.status(500).json({ error: '查询历史记录失败' });
    }

    // 查询 1 条未开奖记录（即将开奖）
    const upcomingQuery = `
      SELECT * FROM records
      WHERE drawTime > ? AND section = ?
      ORDER BY drawTime ASC
        LIMIT 1
    `;

    db.get(upcomingQuery, [currentTime.toISOString(), section], (err, upcomingRecord) => {
      if (err) {
        console.error('查询即将开奖记录失败:', err.message);
        return res.status(500).json({ error: '查询即将开奖记录失败' });
      }

      // 解析历史记录
      const parsedHistoricalRecords = historicalRecords.map(record => {
        let randomZodiacs = [];
        try {
          randomZodiacs = JSON.parse(record.randomZodiacs);
          if (!Array.isArray(randomZodiacs)) throw new Error();
        } catch (e) {
          console.error(`解析 record.id=${record.id} 的 randomZodiacs 失败:`, e);
          randomZodiacs = [];
        }

        let lastNumber = '';
        try {
          const numbers = JSON.parse(record.numbers);
          if (Array.isArray(numbers) && numbers.length > 0) {
            const last = numbers[numbers.length - 1];
            lastNumber = `${last.zodiac}${last.number}`;
          }
        } catch (e) {
          console.error(`解析 record.id=${record.id} 的 numbers 失败:`, e);
          lastNumber = '';
        }

        return {
          period: record.period,
          randomZodiacs: randomZodiacs.slice(0, 6), // 前6个随机生肖
          lastNumber: lastNumber
        };
      });

      // 处理未开奖记录
      let current = null;
      if (upcomingRecord) {
        let randomZodiacs = [];
        try {
          randomZodiacs = JSON.parse(upcomingRecord.randomZodiacs);
          if (!Array.isArray(randomZodiacs)) throw new Error();
        } catch (e) {
          console.error(`解析 upcomingRecord.id=${upcomingRecord.id} 的 randomZodiacs 失败:`, e);
          randomZodiacs = [];
        }

        current = {
          period: upcomingRecord.period,
          randomZodiacs: randomZodiacs.slice(0, 6), // 6 个随机生肖
          drawStatus: '？00' // 未开奖状态
        };
      } else {
        // 如果没有未开奖记录，生成下一期的期数
        if (historicalRecords.length > 0) {
          const latestHistorical = historicalRecords[0];
          let nextPeriod = parseInt(latestHistorical.period, 10) + 1;

          // 确保 nextPeriod 是字符串，并保持期数的格式（如前导零）
          nextPeriod = nextPeriod.toString().padStart(latestHistorical.period.length, '0');

          current = {
            period: nextPeriod,
            randomZodiacs: [], // 可以选择填充默认值或保持为空
            drawStatus: '？00' // 未开奖状态
          };
        } else {
          // 如果没有历史记录，设定默认的期数
          current = {
            period: '001', // 默认期数
            randomZodiacs: [], // 可以选择填充默认值或保持为空
            drawStatus: '？00' // 未开奖状态
          };
        }
      }

      res.json({
        historical: parsedHistoricalRecords, // 前4条历史记录
        current: current // 未开奖的一条记录或生成的下一期
      });

      console.log('返回的 combined-data:', {
        historical: parsedHistoricalRecords,
        current: current,
      });
    });
  });
});



// 导入 fetchContent 路由
const fetchContentRouter = require('./routes/fetchContent');
// 导入 fetchHistory 路由
const fetchHistoryRouter = require('./routes/fetchHistory');

// 使用 fetchContent 路由
app.use('/', fetchContentRouter);

// 使用 fetchHistory 路由
app.use('/', fetchHistoryRouter);

// 退出登录
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
