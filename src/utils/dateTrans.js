// 毫秒转年月日 yyyy-MM-dd
function timestampToDateYMD (timestamp) {
    const dateObj = new Date(timestamp);

    const year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    let date = dateObj.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    return `${year}-{month}-{date}`
}

// 获取年月日的时间戳
function timestampWithYMD (timestamp) {
    const dateObj = new Date(timestamp);
    return new Date(`${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`).getTime();
}

module.exports = {
    timestampToDateYMD
}