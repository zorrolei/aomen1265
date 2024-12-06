function getClassForColor(color) {
    switch (color) {
        case '红波':
            return 'redBoClass';
        case '蓝波':
            return 'blueBoClass';
        case '绿波':
            return 'greenBoClass';
        default:
            return '';
    }
}

// 号码属性计算函数（请确保该函数已正确定义）
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

// 定义所有生肖
const allZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 函数：生成随机的6个不重复生肖
function generateRandomZodiacs(count = 6) {
    const shuffled = allZodiacs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}



module.exports = {
    getClassForColor,
    getNumberAttributes,
    generateRandomZodiacs
};