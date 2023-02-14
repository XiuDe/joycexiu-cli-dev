'use strict';

const path = require('path');

const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync;
const npminstall = require('npminstall');
const pathExists = require('path-exists');
const { isObject } = require('@joycexiu-cli-dev/utils');
const formatPath = require('@joycexiu-cli-dev/format-path');
const { getDefaultRegistry, getNpmLatestVersion } = require('@joycexiu-cli-dev/get-npm-info');

class Package {
    constructor(options) {

        if (!options) {
            throw new Error('Package类的options参数不能为空！');
        }
        if (!isObject(options)) {
            throw new Error('Package类的options参数不能为对象！');
        }
        // console.log('Package constructor.');
        // package的目标路径 存在->从本地获取 不存在->从远程获取
        this.targetPath = options.targetPath;
        // 缓存的路径
        this.storeDir = options.storeDir;
        // package的name
        this.packageName = options.packageName;
        // this.packageName = '@imooc-cli/init'; // 测试缓存路径时模拟数据
        // package的version
        this.packageVersion = options.packageVersion;
        // package的缓存目录前缀
        this.cacheFilePathPreFix = this.packageName.replace('/', '_');

    }
    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPreFix}@${this.packageVersion}@${this.packageName}`);
    }
    
    // 根据传入的packageVersion生成最新的路径
    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPreFix}@${packageVersion}@${this.packageName}`);
    }

    // 缓存路径的准备
    async prepare() {
        // 根据缓存路径创建缓存路径的文件
        if (this.storeDir && !pathExists(this.storeDir)) {
            fse.mkdirpSync(this.storeDir);
        }

        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
        // console.log('prepare:', this.packageVersion);
        // _@imooc-cli_init@1.1.2@@imooc-cli/ 目标格式
        // @imooc-cli/init 1.1.2 现在格式
        // 
    }
    // 判断当前Package是否存在
    async exists() {
        // 判断是缓存还是非缓存
        if (this.storeDir) {
            await this.prepare();
            return pathExists(this.cacheFilePath);
        } else {
            return pathExists(this.targetPath);
        }
    }

    // 安装Package
    async install() {
        await this.prepare();
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }],
        });
    }

    // 更新Package
    async update() {
        await this.prepare();
        // 1. 获取最新的npm模块版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName);
        // 2. 查询最新版本号对应的路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
        // 3. 如果不存在则直接安装最新版本
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [{
                    name: this.packageName,
                    version: latestPackageVersion
                }],
            });
            this.packageVersion = latestPackageVersion;
        }
    }

    // 获取入口文件的路径
    getRootFilePath() {

        function _getRootFile(targetPath) {
            // 1、获取package.json所在目录 - pkg-dir@5.0.0
            // console.log('this.targetPath:', this.targetPath);
            // 当前npm包的跟路径
            const dir = pkgDir(targetPath);// 将输入的targetPath转换为当前npm包的跟路径
            // console.log('pkgDir:', dir); // 定位到相应command包的位置
            if (dir) {
                // 2、读取package.json - require()
                const pkgFile = require(path.resolve(dir, 'package.json'));
                // console.log('pkgFile', pkgFile);
                // 3、寻找main/lib - path
                if (pkgFile && pkgFile.main) {
                    // 4、路径兼容（macOS/windows）
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null;
        }
        if (this.storeDir) { 
            return _getRootFile(this.cacheFilePath);
        } else {
            return _getRootFile(this.targetPath);
        }
    }

}

module.exports = Package;


