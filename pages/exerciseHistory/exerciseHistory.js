const app = getApp()

Page({
  data: {
    exerciseId: null,
    exerciseName: '',
    currentMonth: '',
    dailyRecords: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        exerciseId: options.id,
        exerciseName: options.name
      });

      wx.setNavigationBarTitle({
        title: options.name + '的记录'
      });

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.setData({
        currentMonth: currentMonth
      });
      this.fetchMonthlyRecords(currentMonth);
    }
  },

  // 获取当前月份，格式：YYYY-MM
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  // 月份选择变化
  onMonthChange(e) {
    const month = e.detail.value;
    this.setData({
      currentMonth: month
    });
    this.fetchMonthlyRecords(month);
  },

  // 获取月度记录
  fetchMonthlyRecords: function(month) {
    const that = this;
    wx.request({
      url: `${app.globalData.baseUrl}/exercise/records/monthly?month=${month}&exerciseId=${this.data.exerciseId}`,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 0) {
          const processedRecords = that.processMonthlyRecords(month, res.data.data);
          that.setData({
            dailyRecords: processedRecords
          });
        }
      }
    });
  },

  // 处理月度记录数据
  processMonthlyRecords: function(month, records) {
    const [year, monthStr] = month.split('-');
    const daysInMonth = new Date(year, monthStr, 0).getDate();
    
    // 创建每天的记录对象
    const dailyRecords = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = String(day).padStart(2, '0');  
      const dayRecords = records.filter(r => {
        // 将日期字符串转换为iOS兼容格式 "yyyy-MM-ddTHH:mm:ss"
        const recordTimeStr = r.recordTime.replace(' ', 'T');
        const recordDate = new Date(recordTimeStr);
        return recordDate.getDate() === day;
      }).sort((a, b) => {
        const timeA = a.recordTime.replace(' ', 'T');
        const timeB = b.recordTime.replace(' ', 'T');
        return new Date(timeA) - new Date(timeB);
      });

      // 计算总时长
      const totalSeconds = dayRecords.reduce((sum, record) => sum + record.value, 0);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      const totalDurationText = `${String(totalMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

      // 处理前6条记录
      const displayRecords = Array(6).fill(null);
      dayRecords.slice(0, 6).forEach((record, index) => {
        const minutes = Math.floor(record.value / 60);
        const seconds = record.value % 60;
        displayRecords[index] = {
          durationText: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        };
      });

      dailyRecords.push({
        date,
        totalDurationText,
        recordCount: dayRecords.length,  
        displayRecords
      });
    }

    return dailyRecords; 
  },

  // 获取指定月份的天数
  getDaysInMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  },

  // 构建空的日历数据
  buildEmptyCalendar(daysInMonth) {
    const calendar = [];
    const [year, month] = this.data.currentMonth.split('-');
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
      calendar.push({
        date: date,
        totalDuration: 0,
        records: []
      });
    }
    
    return calendar;
  },

  // 将记录数据填充到日历中
  fillRecordsToCalendar(calendar, records) {
    // 按日期分组记录
    const recordsByDate = {};
    records.forEach(record => {
      const date = record.recordTime.slice(0, 10); // 获取日期部分 YYYY-MM-DD
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // 填充到日历中
    calendar.forEach(dayRecord => {
      const dateRecords = recordsByDate[dayRecord.date] || [];
      
      // 最多取8条记录
      dayRecord.records = dateRecords.slice(0, 8).map(record => ({
        id: record.id,
        time: record.recordTime.slice(11, 16), // 获取时间部分 HH:mm
        duration: record.value // 已经是分钟单位
      }));

      // 计算总时长
      dayRecord.totalDuration = dateRecords.reduce((total, record) => total + record.value, 0);
    });

    return calendar;
  },

  // 切换到上一个月
  onPrevMonth() {
    const date = new Date(this.data.currentMonth);
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    this.setData({
      currentMonth: currentMonth
    });
    this.fetchMonthlyRecords(currentMonth);
  },

  // 切换到下一个月
  onNextMonth() {
    const date = new Date(this.data.currentMonth);
    date.setMonth(date.getMonth() + 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    this.setData({
      currentMonth: currentMonth
    });
    this.fetchMonthlyRecords(currentMonth);
  },
});
