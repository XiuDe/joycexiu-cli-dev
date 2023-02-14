'use strict';


// log模块 根据环境变量打印log的级别
const log = require('npmlog');

// --debug 模式的定义
log.leve = process.env.LOG_LEVEL?process.env.LOG_LEVEL:'info'; // 判断debug模式
log.heading = 'joycexiu-cli'; // 修改前缀
log.headingStyle = { fg: 'cyan', bg: 'white' };

log.addLevel('success',2000,{ fg:'green', bold: true}); // 添加自定义命令


module.exports = log;
