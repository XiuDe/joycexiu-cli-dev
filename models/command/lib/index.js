'use strict';

const semver = require('semver'); // 版本号比对
const colors = require('colors/safe');
const LOWEST_NODE_VERSION = '12.0.0';

class Command {
    constructor(argv) {
        // console.log('Command constructor:', argv);
        this._argv = argv;
        // 仿lerna的书写
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVersion());
            chain = chain.then(() => this.initArgs());
            chain = chain.then(() => this.init());
            chain = chain.then(() => this.exec());
            chain.catch(err=>{
                log.error(err.message);
            })
        });
    }

    // 参数初始化 参数解析
    initArgs(){
        this._cmd = this._argv[this._argv.length - 1];
        this._argv = this._argv.slice(0, this._argv.length - 1);
        // console.log(this._cmd);
        // console.log();
        // console.log(this._argv);
    }

    // 检查node版本号
    checkNodeVersion() {
        // 1、获取当前node版本号
        // console.log(process.version);
        const currentVersion = process.version;
        // 2、比对最低版本号
        const lowestVersion = LOWEST_NODE_VERSION;
        // 3、版本号比对 semver 当前版大于等于最低版
        if (!semver.gte(currentVersion, lowestVersion)) {
            throw new Error(colors.red(`joycexiu-cli-dev 需要安装 v${lowestVersion} 以上版本的Node.js`));
        }

    }

    // 准备阶段
    init() {
        throw new Error('init必须实现');
    }

    // 执行阶段
    exec() {
        throw new Error('exex必须实现');
    }
}

module.exports = Command;

