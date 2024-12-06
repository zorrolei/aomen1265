const express = require('express');
const router = express.Router();
const { getNumberAttributes } = require('../utils'); // 引入辅助函数

// 引入身份认证中间件
const { authenticateToken } = require('../middleware/authenticate');


// 获取号码属性
router.get('/number-info/:number', authenticateToken, (req, res) => {
    const number = req.params.number;
    const attributes = getNumberAttributes(number);
    res.json(attributes);
});
module.exports = router;
