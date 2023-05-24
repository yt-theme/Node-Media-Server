const fs = require('fs');
const path = require('path');

class NodeTransSchedule {
    constructor(config) {
        this.conf = config;
        this.timer = null;
    }

    run () {
        this.checkFileMax();
        const interval =  this.conf.schedule.interval ? this.conf.schedule.interval : 1
        this.timer = setInterval(() => {
            this.checkFileMax();
        }, interval)
    }

    stop () {
        clearInterval(this.timer);
        this.timer = null;
    }

    checkFileMax() {
        try {
            const maxDiskUsage = this.conf.schedule.max_disk_usage;
            const mediaroot = this.conf.mediaroot;
            // 计算媒体目录下文件已占用大小 和 每个平均大小
            const filePath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`;
            const dirRes = fs.readdirSync(filePath)
            // 总大小
            let totalSize = 0;
            // 平均大小
            let avgSize = 0;
            // 存储排序后的文件属性对象数组
            let tmpOrderedFiles = [];
            dirRes.forEach((ite) => {
                let itePath = path.join(filePath, ite);
                const name = ite;
                const fullPath = itePath;
                const stat = fs.statSync(itePath);
                const size = stat.size;
                const birthtimeMs = stat.birthtimeMs;
                totalSize += size;
                tmpOrderedFiles.push({ name, fullPath, size, birthtimeMs });
            });
            avgSize = totalSize / dirRes.length
            // 排序
            tmpOrderedFiles.sort((a, b) => { return a.birthtimeMs - b.birthtimeMs });
            // 去除最新的一项
            tmpOrderedFiles.pop();
            // 删除旧的文件
            console.log("==============================>")
            console.log("dirRes.length =>", dirRes.length)
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