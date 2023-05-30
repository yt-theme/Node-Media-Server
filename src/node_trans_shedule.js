const fs = require('fs');
const path = require('path');
const moment = require("moment");
const { mkdirp } = require("mkdirp");
const { timestampToDateYMD, timestampWithYMD } = require("./utils/dateTrans");

class NodeTransSchedule {
    constructor(config) {
        this.conf = config;
        this.timer = null;
    }

    run () {
       this.checkFileMax();
       this.checkMkdir();
       const interval =  this.conf.schedule.interval ? this.conf.schedule.interval : 1
       this.timer = setInterval(() => {
           this.checkFileMax();
           this.checkMkdir();
       }, interval)

        ///
        // this.checkFileMaxWithDateDir();
        ///
    }

    stop () {
        clearInterval(this.timer);
        this.timer = null;
    }

    // 检测并创建目录 创建当前yyyy-mm-dd的和下一天的
    checkMkdir () {
        const filePath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`;

        const date = moment(new Date());
        const cur = date.format('YYYY-MM-DD');
        const curPath = path.join(filePath, cur);

        date.add(1, 'days');
        date.format('YYYY-MM-DD');
        const tomorrow = date.format('YYYY-MM-DD');
        const tomorrowPath = path.join(filePath, tomorrow);

        
        let isExists = fs.existsSync(curPath);
        if (!isExists) {
            mkdirp.sync(curPath);
        }

        isExists = fs.existsSync(tomorrowPath);
        if (!isExists) {
            mkdirp.sync(tomorrowPath);
        }
    }


    // 将所有目录中文件列出来
    getDirInnerPathAll() {
        const filePath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`;
        const dirRes = fs.readdirSync(filePath)
        let dirRes2 = [];
        let result = [];
        dirRes.forEach((ite) => {
            let itePath = path.join(filePath, ite);
            const stat = fs.statSync(itePath);
            if (stat.isDirectory()) {
                dirRes2 = fs.readdirSync(itePath);
                dirRes2.forEach((ite2) => {
                    let tmpFilePath = path.join(itePath, ite2)
                    result.push(tmpFilePath)
                })
            }
        })
        return result;
    }

    // 检查文件总占用并删除旧文件
    checkFileMax() {
        try {
            const maxDiskUsage = this.conf.schedule.max_disk_usage;
            const mediaroot = this.conf.mediaroot;
            // 计算媒体目录下文件已占用大小 和 每个平均大小
            const fileArr = this.getDirInnerPathAll();
            // 总大小
            let totalSize = 0;
            // 平均大小
            let avgSize = 0;
            // 存储排序后的文件属性对象数组
            let tmpOrderedFiles = [];
            fileArr.forEach((filePath) => {
                const fullPath = filePath;
                const stat = fs.statSync(filePath);
                const size = stat.size;
                const birthtimeMs = stat.birthtimeMs;
                totalSize += size;
                tmpOrderedFiles.push({ fullPath, size, birthtimeMs });
            });
            avgSize = totalSize / fileArr.length
            // 排序
            tmpOrderedFiles.sort((a, b) => { return a.birthtimeMs - b.birthtimeMs });
            // 去除最新的一项
            tmpOrderedFiles.pop();
            // 删除旧的文件
            console.log("==============================>")
            console.log("fileArr.length =>", fileArr.length)
            console.log("totalSize =>", totalSize)
            console.log("maxDiskUsage =>", maxDiskUsage)
            console.log("avgSize =>", avgSize)
            console.log("(maxDiskUsage + avgSize + avgSize) =>", (totalSize >= (maxDiskUsage - (avgSize * 2))))
            if (tmpOrderedFiles.length > 0 && (totalSize >= (maxDiskUsage - (avgSize * 2)))) {
                // 累加文件项大小直到小于maxDiskUsage
                let tmpAccu = 0;
                // 用于存储待删除文件
                let tmpForDelFilePathList = [];
                for (let i=0; i<tmpOrderedFiles.length; i++) {
                    tmpAccu += tmpOrderedFiles[i].size;
                    tmpForDelFilePathList.push(tmpOrderedFiles[i].fullPath)
                    if ((totalSize - tmpAccu) < (maxDiskUsage - (avgSize * 2))) {
                        break;
                    }
                }
                // 删除文件
                tmpForDelFilePathList.forEach((ite) => {
                    fs.unlinkSync(ite);
                    tmpOrderedFiles.shift();
                })
            }
        } catch (e) {
            return false;
        }
    }
}
module.exports = NodeTransSchedule;