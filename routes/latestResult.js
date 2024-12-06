// routes/latestResult.js

const express = require('express');
const { db } = require('../dbInit'); // 引入数据库连接
const { getClassForColor } = require('../utils'); // 引入辅助函数

const router = express.Router();



// 最新开奖结果的 API 端点
router.get('/latest-result', (req, res) => {
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

module.exports = router;
