'use strict';

module.exports = core;

const path = require('path');

const semver = require('semver'); // 版本号比对
const colors = require('colors/safe'); // 
// 用户主目录相关
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
// commander
const commander = require('commander');

const log = require('@joycexiu-cli-dev/log');
const exec = require('@joycexiu-cli-dev/exec');

// 最低版本号
const constant = require('./const');


/**
 * require可接收的文件 .js/.json/.node
 * .js -> module.exports/exports
 * .json -> JSON.parse
 * 任何类型的文件只要能被js引擎解析（符合js语法）都不会报错，如果无法解析，则会报错。
 */
const pkg = require('../package.json');

// commander
const program = new commander.Command();

async function core() {
    // 与throw new Error一起处理
    try {
        await prepare();
        // 注册命令
        registerCommand();
    } catch (e) {
        log.error(e.message);
        if(program.debug){
            console.log(e);
        }
    }
}

// 注册命令
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')
        .version(pkg.version);

    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec)

    // 开启debug模式
    program.on('option:debug', function () {
        if (program.debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }
        log.level = process.env.LOG_LEVEL;
        // log.verbose('test');
    })

    // 指定targetPath options放在on上，属性监听，在执行业务逻辑之前执行
    program.on('option:targetPath', function(){
        // console.log(program.targetPath);
        // 通过环境做业务逻辑解耦
        process.env.CLI_TARGET_PATH = program.targetPath;
    });

    // 对未知命令监听
    program.on('command:*', function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('未知的命令：' + obj[0]));
        if (availableCommands.length > 0) {
            console.log(colors.red('可用命令：' + availableCommands.join(',')));
        }
    })

    program.parse(process.argv);
    // console.log(program);
    // 参数解析之后
    if (program.args && program.args.length < 1 ) {
        program.outputHelp();
        console.log();
    }

}

// 脚手架运行准备阶段
async function prepare(){
    // 检查版本号
    checkPkgVersion();
    // root账号检查
    checkRoot();
    // 检查用户主目录
    checkUserHome();
    // 检查用户入参
    // checkInputArgs();
    // 检查环境变量
    checkEnv();
    // 检查版本更新
    await checkGlobalUpdate();
}

// 检查版本更新
async function checkGlobalUpdate() {
    // 1、获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2、调用npm API，获取所有的版本号
    // 3、提取所有版本号，比对哪些版本号是大于当前版本号
    // getNpmSemverVersion(currentVersion,npmName);
    // 4、获取最新的版本号，提示用户更新到该版本

    const { getNpmSemverVersion } = require('@joycexiu-cli-dev/get-npm-info');
    const lastVersions = await getNpmSemverVersion(currentVersion, npmName);
    // console.log('获取当前脚手架最新的npm versions信息:', lastVersions);
    if (lastVersions && semver.gt(lastVersions, currentVersion)) {
        log.warn('更新提示', colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersions}
更新命令：npm install -g ${npmName}`));
    }

}

// 检查环境变量
function checkEnv() {
    const dotEnv = require('dotenv');
    const dotEnvPath = path.resolve(userHome, '.env');
    if (pathExists(dotEnvPath)) {
        dotEnv.config({
            path: dotEnvPath
        });
    }

    createDefaultConfig();
    // 缓存路径 脚手架准备阶段去除 debug 打印
    // log.verbose('环境变量', process.env.CLI_HOME_PATH);
}
function createDefaultConfig() {
    // console.log('path:',path);
    // console.log('userHome:',userHome); // /Users/zhangxiude
    // console.log(path.join(userHome, constant.DEFAULT_CLI_HOME)); // /Users/zhangxiude/.sci99-cli
    const cliConfig = {
        home: userHome,
    };
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }

    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查用户入参 这部分逻辑不需要，移除 minimist
// 这部分内容在准备阶段不打印log日志，需要在命令注册阶段debug
// function checkInputArgs() {
//     const minimist = require('minimist');
//     args = minimist(process.argv.slice(2));
//     // console.log(args);
//     checkArgs();
// }
// function checkArgs() {
//     if (args.debug) {
//         process.env.LOG_LEVEL = 'verbose';
//     } else {
//         process.env.LOG_LEVEL = 'info';
//     }
//     log.level = process.env.LOG_LEVEL;
// }

// 检查用户主目录
function checkUserHome() {
    // console.log(userHome);
    // 
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在！'));
    }
}

// root账号检查
function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck();
    // 501普通用户 0root用户
    // console.log(process.geteuid());
}

// 检查当前脚手架版本号
function checkPkgVersion() {
    // log.notice('cli', pkg.version);
    log.info('cli', pkg.version);
}
