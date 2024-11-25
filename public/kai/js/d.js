function countDown(timestr, serverTime, id) {
  //alert('kj:' +timestr);
  //alert('serverTime'+ serverTime);
  //alert('id'+ id);
  //alert('cptype' + cptype);
  //alert('lotteryname' + lotteryname);
  //timestr：下期开奖时间
  //serverTime：服务器时间
  //id：倒计时显示区域
  //category：彩种类别
  var time = timestr.replace("-", "/");
  var serverTime = serverTime.replace("-", "/");
  time = time.replace("-", "/");
  serverTime = serverTime.replace("-", "/");
  //var day_elem = $(id).find('.day');
  var hour_elem = $(id).find('.hour');
  var minute_elem = $(id).find('.minute');
  var second_elem = $(id).find('.second');
  var opentyle = $(id).find('.opentyle');
  var timebox = $(id).find('#timebox');
  var cuttime = $(id).find('.cuttime');
  var end_time = new Date(time).getTime(); //月份是实际月份-1
  

  var sys_second = (end_time - new Date(serverTime).getTime()) / 1000;

  //alert(sys_second);
      //sys_second = sys_second - 1000;
  var timer = setInterval(function() {
    if(sys_second > 1) {
      sys_second -= 1;
      //var day = Math.floor((sys_second / 3600) / 24);
      var hour = Math.floor((sys_second / 3600));
      var minute = Math.floor((sys_second / 60) % 60);
      var second = Math.floor(sys_second % 60);
      //day_elem && $(day_elem).text(day); //计算天
      $(hour_elem).text(hour < 10 ? "0" + hour : hour); //计算小时
      $(minute_elem).text(minute < 10 ? "0" + minute : minute); //计算分钟
      $(second_elem).text(second < 10 ? "0" + second : second); //计算秒杀
      $(cuttime).show();
      //如果时间小于0则删除时间显示
      if(hour <= 0) {
        $(id).find(".hourtxt").hide();
        $(id).find(".hour").hide();
      } else {
        $(id).find(".hourtxt").show();
        $(id).find(".hour").show();
      }
    } else {
      //alert(cptype);
      $(opentyle).show(); //倒计时区域显示开奖中...
      $(cuttime).hide(); //倒计时区域隐藏...
      clearInterval(timer); //清除当前定时器
      //newindexObj.ajaxRequst($(id).find(".nextIssue").text(), $(id).attr("id")); //请求后台加载数据传入一下期期数
      //newindexObj.doit(cptype, lotteryname, id);
    }
  }, 1000);
}