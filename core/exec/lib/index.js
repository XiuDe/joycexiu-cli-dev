'use strict';
const path = require('path');

const cp = require('child_process'); 

const log = require('@joycexiu-cli-dev/log');
const Package = require('@joycexiu-cli-dev/package');
const CACHE_DIR = 'dependencies';
let pkg;

// 手动映射表：不同bu之间可以用用户登录信息和init信息传到服务端返回packageName即可
const SETTINGS = {
    init: '@joycexiu-cli-dev/init'
}

async function exec() {
    // 1. targetPath -> modulePath
    // 2. modulePath -> Package(npm模块)
    // 3. Package.getRootFile(获取入口文件)
    // 4. Package.update / Package.install

    // 封装 -> 复用

    // 判断是否是本地连接
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    let storeDir = '';
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);


    // init后的projectName 和 cmdObj对象 及后续参数不确定，需要用arguments获取 
    // console.log(arguments); // 能拿到很多重要信息
    // 拿到cmdObj信息在执行init时非常重要

    const cmdObj = arguments[arguments.length - 1];
    // console.log(cmdObj.name()); // 拿到<command>方法
    const cmdName = cmdObj.name(); // 可以做映射表，由cmdName映射到具体的package
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';
    // const packageVersion = '1.1.0'; // 模拟版本更新逻辑  


    // targetPath不存在才生成缓存路径，生成缓存路径后调用install方法
    if (!targetPath) {
        // 生成package的缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR);
        storeDir = path.resolve(targetPath, 'node_modules');
        // console.log('!targetPath:', targetPath, storeDir);
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);

        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        });
        if (await pkg.exists()) {
            // 更新package
            await pkg.update();
        } else {
            // 安装package
            await pkg.install();
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        });
    }
    // console.log('await pkg.exists():',await pkg.exists()); // false
    const rootFile = pkg.getRootFilePath();
    // console.log('rootFile:',rootFile); // command命令的入口文件路径
    // 直接执行 后续改成node多进程实现
    // apply(null, argumen); 
    // null未改变this指向，
    // apply将arguments数组变为一般入参 [1,2,3]->1,2,3

    // call
    if (rootFile) {
        try {
            // 在当前进程中调用
            // require到用户输入的指定command的入口文件
            // 实现方式一：
            // require(rootFile).apply(null,arguments); 
            // require(rootFile).call(null, Array.from(arguments));
            // 实现方式二：
            // 在node子进程中调用
            // a、
            // const code = '';
            // const child = cp.spawn('node', ['-e', code], {
            //     cwd: process.cwd()
            // });
            // child.stdout.on('data', (chunk =>{}));
            // child.stderr.on('data', (chunk =>{}));
            // b、stdio的inherit属性
            // const code = 'console.log(1)';
            const args = Array.from(arguments);
            const cmd = args[args.length - 1];
            const o = Object.create(null); // 创建一个没有原型链的对象
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key];
                }
            });
            args[args.length - 1] = o;
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
            // win: cmd /c node -e ...  macos: node -e ...
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            child.on('error', e => {
                log.error(e.message);
                process.exit(1);
            });
            child.on('exit', e => {
                log.verbose('命令执行成功：', e);
                process.exit(e);
            })

        } catch (e) {
            log.error(e.message);
        }

    }

    function spawn(command, args, options) {
        const win32 = process.platform === 'win32';

        const cmd = win32 ? 'cmd' : command;
        const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

        return cp.spawn(cmd, cmdArgs, options || {});
    }


}

module.exports = exec;
