'use strict';

const log = require('@joycexiu-cli-dev/log');
const Command = require('@joycexiu-cli-dev/command');

class InitCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        // console.log(this.projectName,this.force);
        log.verbose('this.projectName', this.projectName);
        log.verbose('force', this.force);
        
    }
    exec(){
        console.log('init的业务逻辑！');
    }
}

function init(argv){
    // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
    // return new InitCommand(); // argv参数为空时的判断 error
    // return new InitCommand([]); // argv为数组时的判断 正常执行做参数处理
    // return new InitCommand({}); // argv为对象时的判断 error
    return new InitCommand(argv);
}


module.exports = init;
module.exports.InitCommand = InitCommand;

