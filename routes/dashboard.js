const express = require('express');
const router = express.Router();
const { db } = require('../dbInit'); // 引入数据库连接
const { getNumberAttributes,generateRandomZodiacs } = require('../utils'); // 引入辅助函数

// 引入身份认证中间件
const { authenticateToken } = require('../middleware/authenticate');


// 管理页面
router.get('/dashboard', authenticateToken, (req, res) => {
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


module.exports = router;
