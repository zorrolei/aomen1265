// routes/fetchHistory.js

const express = require('express');
const puppeteer = require('puppeteer');
const cache = require('../cache'); // 引入缓存模块
const { db } = require('../dbInit'); // 引入数据库连接
const { getClassForColor } = require('../utils'); // 引入辅助函数

const router = express.Router();



// 通用的抓取函数，可以复用
async function fetchContent(url, cacheKey) {
    // 检查缓存中是否存在数据
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cachedData;
    }

    console.log(`Cache miss for key: ${cacheKey}. Fetching new data...`);

    try {
        // 启动 Puppeteer 浏览器
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // executablePath: '/usr/bin/google-chrome' // 服务器配置此路径
        });
        const page = await browser.newPage();

        // 访问目标网站
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 获取 class="cgi-wrap" 元素的 HTML 内容
        const content = await page.evaluate(() => {
            const element = document.querySelector('.cgi-wrap'); // 获取 class="cgi-wrap" 元素
            return element ? element.innerHTML : ''; // 返回元素的内容，如果没有找到则返回空字符串
        });

        await browser.close();

        // 将抓取到的数据存入缓存
        cache.set(cacheKey, content);
        console.log(`Data cached with key: ${cacheKey}`);

        return content;
    } catch (error) {
        console.error('Error fetching content:', error);
        throw error;
    }
}

// 抓取历史记录2（需要认证）
router.get('/fetch-history2', async (req, res) => {
    const url = 'https://kj.123pmz.com/kj/';
    const cacheKey = `fetch-history2`;

    try {
        const content = await fetchContent(url, cacheKey);
        res.send(content);
    } catch (error) {
        res.status(500).send('Error fetching content');
    }
});

// 抓取历史记录3（需要认证）
router.get('/fetch-history3', async (req, res) => {
    const url = 'https://kj.123565.com/kj/';
    const cacheKey = `fetch-history3`;

    try {
        const content = await fetchContent(url, cacheKey);
        res.send(content);
    } catch (error) {
        res.status(500).send('Error fetching content');
    }
});

// 添加 /history 路由（无需认证）
router.get('/history', (req, res) => {
    const section = req.query.section || '1'; // 默认分类为 1

    const currentTime = new Date();

    // 查询指定分类的最后一条已开奖的记录（drawTime <= currentTime）
    db.get(
        'SELECT * FROM records WHERE drawTime <= ? AND section = ? ORDER BY drawTime DESC LIMIT 1',
        [currentTime.toISOString(), section],
        (err, lastRecord) => {
            if (err) {
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
                db.all(
                    'SELECT * FROM records WHERE section = ? AND drawTime < ? ORDER BY drawTime DESC',
                    [section, lastRecord.drawTime],
                    (err, rows) => {
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
                    }
                );
            } else {
                // 当前时间已超过最后一条记录的开奖时间，返回所有历史记录，包括最后一条记录
                db.all(
                    'SELECT * FROM records WHERE section = ? AND drawTime <= ? ORDER BY drawTime DESC',
                    [section, currentTime.toISOString()],
                    (err, rows) => {
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
                    }
                );
            }
        }
    );
});

module.exports = router;
