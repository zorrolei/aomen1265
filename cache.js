// cache.js

const NodeCache = require('node-cache');

// 创建缓存实例，设置默认的 TTL（时间存活期）为 1 小时（3600 秒）
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

module.exports = cache;
