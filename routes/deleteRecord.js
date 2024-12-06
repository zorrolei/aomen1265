// routes/deleteRecord.js
const express = require('express');
const router = express.Router();
const { db } = require('../dbInit'); // 引入数据库连接

// 引入认证中间件
const { authenticateToken } = require('../middleware/authenticate');


// 删除记录的路由
router.post('/delete-record', authenticateToken, (req, res) => {
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

module.exports = router;
