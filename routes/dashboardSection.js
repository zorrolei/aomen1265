const express = require('express');
const router = express.Router();
const { db } = require('../dbInit'); // 引入数据库连接
const { getNumberAttributes,generateRandomZodiacs } = require('../utils'); // 引入辅助函数

// 引入身份认证中间件
const { authenticateToken } = require('../middleware/authenticate');


// 添加开奖结果 - 处理所有区域
router.post('/dashboard/section/:sectionId', authenticateToken, (req, res) => {
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
    let randomZodiacs;
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

module.exports = router;
