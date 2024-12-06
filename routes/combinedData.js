// routes/combinedData.js

const express = require('express');
const { db } = require('../dbInit'); // 引入数据库连接
const { getClassForColor } = require('../utils'); // 引入辅助函数

const router = express.Router();


// 6肖6码接口 端点：获取前4条历史记录和当前记录（无需验证）
router.get('/combined-data', (req, res) => {
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

module.exports = router;
