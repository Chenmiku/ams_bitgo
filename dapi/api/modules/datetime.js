exports.convertDateTime = function(value){
    let a = new Date(value * 1000)
    let year = a.getFullYear()
    let month = a.getMonth()
    let date = a.getDate()
    let hour = a.getHours()
    let minute = a.getMinutes()
    let second = a.getSeconds()
    let time = year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second
    return time
}