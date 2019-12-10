exports.convertDateTime = function(value){
    var a = new Date(value * 1000)
    var year = a.getFullYear()
    var month = a.getMonth()
    var date = a.getDate()
    var hour = a.getHours()
    var minute = a.getMinutes()
    var second = a.getSeconds()
    var time = year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second
    return time
}