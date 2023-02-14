#!/usr/bin/env node

// const utils = require('@joycexiu-cli-dev/utils');
// utils();

const importLocal = require('import-local');

if(importLocal(__filename)){
    require('npmlog').info('cli', '正在使用本地 joycexiu-cli-dev 版本');
}else{
    require('../lib')(process.argv.slice(2));
}