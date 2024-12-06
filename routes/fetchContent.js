// routes/fetchContent.js

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cache = require('../cache'); // 引入缓存模块

const router = express.Router();

// 通用的抓取函数，可以复用
async function fetchContentWithCache(url, cacheKey) {
    // 检查缓存中是否存在数据
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cachedData;
    }

    console.log(`Cache miss for key: ${cacheKey}. Fetching new data...`);

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // 抓取目标内容
        let targetContent = $('.cgi-body').html(); // 根据实际情况选择目标部分

        if (targetContent) {
            const replacements = [
                { pattern: /新日头条/g, replacement: '澳门全民彩' },
                { pattern: /http:\/\/1\.xinxincc\.xyz\/kai\.html/g, replacement: 'kai/tab.html' },
                { pattern: /香港新日彩/g, replacement: '澳门全民彩' },
                { pattern: /xin1265\.com/g, replacement: 'aomen1265.com' }
            ];

            replacements.forEach(({ pattern, replacement }) => {
                targetContent = targetContent.replace(pattern, replacement);
            });

            // 使用 Cheerio 解析替换后的 HTML
            const $content = cheerio.load(targetContent);

            // 移除所有 <a> 标签的 href 属性
            $content('a[href^="cat/"]').each((i, elem) => {
                const hrefValue = $content(elem).attr('href');
                if (/^cat\/\d+$/.test(hrefValue)) {
                    // 移除 href 属性，使其不可点击
                    $content(elem).removeAttr('href');
                }
            });

            // 移除具有 class="zzhl" 的元素
            $content('.zzhl').remove();
            $content('img[src="https://https.50234.site/static/home/new/images/jc.png"]').remove();

            // 移除高手榜图片
            $content('img').each((i, elem) => {
                const src = $content(elem).attr('src');
                const className = $content(elem).attr('class');
                if (src === '/images/10009.jpg' && className?.includes('lazyloaded')) {
                    $content(elem).remove();
                    console.log(`Removed image with src="/images/10009.jpg" and class="lazyloaded"`);
                }
            });

            // 修改导航栏中的 <a> 标签：将 value 属性替换为 href 属性
            $content('#nav2 a').each((i, elem) => {
                const value = $content(elem).attr('value');
                if (value) {
                    $content(elem).attr('href', value); // 设置新的 href 属性
                    $content(elem).removeAttr('value'); // 移除旧的 value 属性
                    console.log(`Replaced value="${value}" with href="${value}" in <a> tag`);
                }
            });

            // **交换特定 <li> 元素的位置**
            const li1 = $content('a[href="#1x1m"]').parent();
            const li2 = $content('a[href="#jy4x"]').parent();

            if (li1.length && li2.length) {
                // 创建临时占位符
                const placeholder = $content('<li></li>');
                li1.before(placeholder);
                li2.before(li1);
                placeholder.replaceWith(li2);
                console.log('Swapped <li> elements: "一肖一码" and "六肖中特"');
            } else {
                console.warn('未找到需要交换的 <li> 元素');
            }

            // **处理块 A 和块 B 的交换**
            // 1. 获取块 A: 父级 <div> 的 id="wuxiao"
            const originalBlockA = $content('#wuxiao').parent();
            if (!originalBlockA.length) {
                console.warn('未找到 id="wuxiao" 的父级 <div>');
            }

            // 2. 获取块 B:
            //    a. 包含文字“澳门全民彩《六肖中特》”的最上级 <table>
            //    b. 紧挨着该 <table> 的 <div>
            const targetText = '澳门全民彩《六肖中特》';

            // 查找包含目标文字的 <table>
            const blockBTable = $content('table').filter(function () {
                return $content(this).text().includes(targetText);
            }).first();

            if (!blockBTable.length) {
                console.warn(`未找到包含文字 "${targetText}" 的 <table> 标签`);
            }

            // 查找紧接在该 <table> 后面的 <div>
            const blockBDiv = blockBTable.next('div');
            if (!blockBDiv.length) {
                console.warn(`未找到 <table> 标签 "${targetText}" 之后的紧接 <div> 标签`);
            }

            // 3. 处理块 A
            if (originalBlockA.length) {
                // 给块 A 添加新的 ID="1x1m"
                originalBlockA.attr('id', '1x1m');
                console.log('为块 A 添加了新的 ID="1x1m"');

                // 移除页面上原先拥有 ID="1x1m" 的元素，排除当前块 A
                $content('#1x1m').not(originalBlockA).remove();
                console.log('移除了原先拥有 ID="1x1m" 的元素');
            }

            // 4. 处理块 B
            if (blockBTable.length && blockBDiv.length) {
                // 给块 B 的 <table> 添加新的 ID="jy4x"
                blockBTable.attr('id', 'jy4x');
                console.log('为块 B 的 <table> 添加了新的 ID="jy4x"');

                // 移除页面上原先拥有 ID="jy4x" 的元素，排除当前块 B 的 <table>
                $content('#jy4x').not(blockBTable).remove();
                console.log('移除了原先拥有 ID="jy4x" 的元素');
            }

            // 5. 交换块 A 和块 B 的位置
            if (originalBlockA.length && blockBTable.length && blockBDiv.length) {
                // 创建占位符来保存块 A 的位置
                const placeholder = $content('<div></div>');
                originalBlockA.before(placeholder);

                // 移动块 B 的 <table> 和 <div> 到块 A 的位置
                blockBTable.insertBefore(placeholder);
                blockBDiv.insertBefore(placeholder);

                // 移动块 A 到块 B 的原位置
                originalBlockA.insertBefore(blockBTable);
                originalBlockA.insertBefore(blockBDiv);

                // 移除占位符
                placeholder.remove();

                console.log('Swapped Block A (id="1x1m") with Block B (id="jy4x" and adjacent div)');
            } else {
                console.warn('未找到需要交换的块 A 或块 B');
            }

            // **替换 id="jy4x" 下面紧接的 <div> 为 <iframe>**
            // 假设块 B 的 <table> 现在具有 id="jy4x"，并且它的下一个兄弟元素是需要替换的 <div>
            const jy4xElement = $content('#jy4x');
            if (jy4xElement.length === 1) {
                const adjacentDiv = jy4xElement.next('div');
                if (adjacentDiv.length) {
                    // 创建一个新的 <iframe> 元素
                    const iframe = $content('<iframe></iframe>')
                        .attr('src', 'kai/6xiao.html') // 替换为实际的 iframe 源地址
                        .attr('width', '100%') // 根据需要设置宽度
                        .attr('height', '411') // 根据需要设置高度
                        .attr('frameborder', '0'); // 可选属性

                    // 用 <iframe> 替换原有的 <div>
                    adjacentDiv.replaceWith(iframe);
                    console.log('已将 id="jy4x" 下面的 <div> 替换为 <iframe>');
                } else {
                    console.warn('未找到 id="jy4x" 下面紧接的 <div> 元素');
                }
            } else {
                console.warn('未找到唯一的 id="jy4x" 元素');
            }

            // 查找 header 中的图片并修改
            $('header.cgi-head-home img').each(function () {
                const imgSrc = $(this).attr('src');
                console.log(`Found image src: ${imgSrc}`); // 输出调试信息

                // 检查是否为目标图片
                if (imgSrc && imgSrc === '/images/10001.jpg') {
                    $(this).attr('width', '100%'); // 添加 width="100%"
                    console.log(`Added width="100%" to image with src="/images/10001.jpg"`);
                }
            });

            // 选择所有 <img> 标签
            const targetImageSrc = 'https://d31q194n7fpdes.cloudfront.net/mygai/tp/49tk/chrome.gif';

            $('img').each((index, element) => {
                const src = $content(element).attr('src');
                if (src === targetImageSrc) {
                    $content(element).remove();
                    console.log(`已移除图片: ${src}`);
                }
            });

            // **获取最终的 HTML 内容**
            targetContent = $content.html();
        }

        // 将抓取到的内容存入缓存
        cache.set(cacheKey, targetContent);
        console.log(`Data cached with key: ${cacheKey}`);

        return targetContent;
    } catch (error) {
        console.error('Error fetching content:', error.message);
        throw error;
    }
}

// 定义 /fetch-content 路由
router.get('/fetch-content', async (req, res) => {
    const url = 'http://xin1265.com/';
    const cacheKey = `fetch-content`;

    try {
        const content = await fetchContentWithCache(url, cacheKey);
        res.send(content);
    } catch (error) {
        res.status(500).send('Error fetching content');
    }
});

module.exports = router;
