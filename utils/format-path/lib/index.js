'use strict';

const path = require('path');

module.exports = function formatPath(p) {
    if(p && typeof p === 'string'){
        // 分隔符/ windows是D:\\需要转成/
        const sep = path.sep;
        if(sep === '/'){
            return p;
        } else {
            return p.replace(/\\/g, '/');
        }
    }
    return p;
}
