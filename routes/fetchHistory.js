// routes/fetchHistory.js

const express = require('express');
const puppeteer = require('puppeteer');
const cache = require('../cache'); // 引入缓存模块

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

// 抓取历史记录2
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

// 抓取历史记录3
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

module.exports = router;
