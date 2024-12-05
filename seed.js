// seed.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 配置常量
const DB_PATH = path.join(__dirname, 'records.db'); // 确保与 app.js 中的路径一致

// 定义所有生肖
const allZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 函数：生成随机的6个不重复生肖
function generateRandomZodiacs(count = 6) {
    const shuffled = [...allZodiacs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 号码属性计算函数
function getNumberAttributes(number) {
    const numberInt = parseInt(number, 10); // 用于属性计算
    const zodiacMap = {
        '鼠': [5, 17, 29, 41],
        '牛': [4, 16, 28, 40],
        '虎': [3, 15, 27, 39],
        '兔': [2, 14, 26, 38],
        '龙': [1, 13, 25, 37, 49],
        '蛇': [12, 24, 36, 48],
        '马': [11, 23, 35, 47],
        '羊': [10, 22, 34, 46],
        '猴': [9, 21, 33, 45],
        '鸡': [8, 20, 32, 44],
        '狗': [7, 19, 31, 43],
        '猪': [6, 18, 30, 42]
    };

    const elementMap = {
        '金': [2, 3, 10, 11, 24, 25, 32, 33, 40, 41],
        '木': [6, 7, 14, 15, 22, 23, 36, 37, 44, 45],
        '水': [12, 13, 20, 21, 28, 29, 42, 43],
        '火': [1, 8, 9, 16, 17, 30, 31, 38, 39, 46, 47],
        '土': [4, 5, 18, 19, 26, 27, 34, 35, 48, 49]
    };

    const colorMap = {
        '红波': [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46],
        '蓝波': [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48],
        '绿波': [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]
    };

    const sumParityMap = {
        '合数单': [1, 3, 5, 7, 9, 10, 12, 14, 16, 18, 21, 23, 25, 27, 29, 30, 32, 34, 36, 38, 41, 43, 45, 47, 49],
        '合数双': [2, 4, 6, 8, 11, 13, 15, 17, 19, 20, 22, 24, 26, 28, 31, 33, 35, 37, 39, 40, 42, 44, 46, 48]
    };

    let zodiac, element, color, sumParity;

    for (const [key, nums] of Object.entries(zodiacMap)) {
        if (nums.includes(numberInt)) {
            zodiac = key;
            break;
        }
    }

    for (const [key, nums] of Object.entries(elementMap)) {
        if (nums.includes(numberInt)) {
            element = key;
            break;
        }
    }

    for (const [key, nums] of Object.entries(colorMap)) {
        if (nums.includes(numberInt)) {
            color = key;
            break;
        }
    }

    for (const [key, nums] of Object.entries(sumParityMap)) {
        if (nums.includes(numberInt)) {
            sumParity = key;
            break;
        }
    }

    return {
        number: number, // 保留原始字符串形式的号码
        zodiac,
        element,
        color,
        sumParity
    };
}

// 初始化数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('无法连接到数据库:', err.message);
        process.exit(1);
    } else {
        console.log('成功连接到 SQLite 数据库');
    }
});

// 获取当前记录的最大 period，以便后续生成新的 period
function getMaxPeriod() {
    return new Promise((resolve, reject) => {
        db.get('SELECT period FROM records ORDER BY CAST(period AS INTEGER) DESC LIMIT 1', [], (err, row) => { // 确保按数值排序
            if (err) {
                return reject(err);
            }
            if (row) {
                resolve(parseInt(row.period, 10));
            } else {
                resolve(0); // 如果没有记录，开始从0
            }
        });
    });
}

// 生成每天21:30的 drawTime，340期对应今天，1期对应339天前
function generateDrawTime(index, total, today) {
    const daysToSubtract = total - index - 1; // 例如 index=0 时，daysToSubtract=339
    const drawDate = new Date(today);
    drawDate.setDate(today.getDate() - daysToSubtract);
    drawDate.setHours(21, 30, 0, 0); // 设置为21:30:00.000
    return drawDate.toISOString();
}

// 生成随机 section（1, 2, 3）
function generateRandomSection() {
    const sections = ['1'];
    return sections[Math.floor(Math.random() * sections.length)];
}

// 插入单条记录
function insertRecord(record) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO records (period, numbers, drawTime, section, randomZodiacs) VALUES (?, ?, ?, ?, ?)',
            [
                record.period,
                JSON.stringify(record.numbers),
                record.drawTime,
                record.section,
                JSON.stringify(record.randomZodiacs)
            ],
            function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            }
        );
    });
}

// 主函数
async function seedDatabase() {
    try {
        // 确保数据库中有records表
        await new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS records (
                                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                       period TEXT NOT NULL,
                                                       drawTime TEXT NOT NULL,
                                                       section TEXT NOT NULL,
                                                       randomZodiacs TEXT,
                                                       numbers TEXT
                )
            `, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // 可选：清空表中的现有记录
        // 如果你已经手动清空了数据库，可以跳过这一步
        // 否则，取消下面的注释以在脚本运行时自动清空表
        /*
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM records', [], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        console.log('已清空 records 表中的所有记录');
        */

        const maxPeriod = await getMaxPeriod();
        console.log(`当前最大期数: ${maxPeriod}`);

        const recordsToInsert = 340;
        const today = new Date(); // 今天的日期

        for (let i = 0; i < recordsToInsert; i++) {
            const periodNumber = maxPeriod + i + 1; // 期数从 maxPeriod + 1 开始
            const period = periodNumber.toString().padStart(3, '0'); // 保持3位数格式，如 '001'

            // 生成7个不重复的号码，范围1-49
            const numbersSet = new Set();
            while (numbersSet.size < 7) {
                const num = Math.floor(Math.random() * 49) + 1; // 1-49
                numbersSet.add(num.toString().padStart(2, '0')); // 保持2位数格式，如 '01'
            }
            const numbersArray = Array.from(numbersSet).map(num => getNumberAttributes(num));

            // 生成drawTime，340期对应今天，1期对应339天前
            const drawTime = generateDrawTime(i, recordsToInsert, today);

            // 生成随机section
            const section = generateRandomSection();

            // 生成随机zodiacs
            const randomZodiacs = generateRandomZodiacs(6);

            const record = {
                period,
                numbers: numbersArray,
                drawTime,
                section,
                randomZodiacs
            };

            try {
                const insertedId = await insertRecord(record);
                if ((i + 1) % 50 === 0 || i + 1 === recordsToInsert) { // 每50条记录输出一次
                    console.log(`已插入 ${i + 1} 条记录 (ID=${insertedId}, 期数=${period})`);
                }
            } catch (insertErr) {
                console.error(`插入记录失败 (期数=${period}):`, insertErr.message);
            }
        }

        console.log('数据生成完成！');
    } catch (err) {
        console.error('数据生成过程中出错:', err.message);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接时出错:', err.message);
            } else {
                console.log('数据库连接已关闭');
            }
        });
    }
}

// 运行主函数
seedDatabase();
