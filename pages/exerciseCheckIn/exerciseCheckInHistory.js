const app = getApp()

Page({
  data: {
    exerciseId: null,
    exerciseName: '',
    currentDate: '',
    currentYear: '',
    currentMonth: '',
    calendarData: [],
    monthlyTotal: 0,  // 添加本月打卡总次数
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        exerciseId: options.id,
        exerciseName: options.name
      });

      wx.setNavigationBarTitle({
        title: `${options.name}打卡记录`
      });

      // 初始化当前日期
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentMonth = `${year}-${month}`;
      
      this.setData({
        currentDate: currentMonth,
        currentYear: year,
        currentMonth: month
      });

      // 加载当月记录
      this.loadMonthlyRecords(currentMonth);
    }
  },

  // 月份选择改变
  onMonthChange(e) {
    const date = new Date(e.detail.value);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    this.setData({
      currentDate: currentMonth,
      currentYear: year,
      currentMonth: month
    });

    this.loadMonthlyRecords(currentMonth);
  },

  // 加载月度记录
  loadMonthlyRecords(month) {
    this.setData({ loading: true });

    wx.request({
      url: `${app.globalData.baseUrl}/exercise/records/monthly?month=${month}&exerciseId=${this.data.exerciseId}`,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 0) {
          // 生成日历数据
          const calendarData = this.generateCalendarData(month, res.data.data || []);
          this.setData({ calendarData });
        } else {
          wx.showToast({
            title: res.data.message || '获取记录失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 日期点击事件处理
  onDateClick(e) {
    console.log('日期点击:', e.currentTarget.dataset);
    console.log('日期点击:', e.currentTarget);
    const { date, count } = e.currentTarget.dataset;
    const dateObj = new Date(date);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    if (!isNaN(dateObj.getTime())) {
      if (count > 0) {
        console.log('日期点击:', e.currentTarget.dataset);
        wx.navigateTo({
          url: `/pages/exerciseCheckIn/exerciseCheckInDetails?date=${date.split('T')[0]}&exerciseId=${this.data.exerciseId}`
        });
      }
    } else {
      console.error('Invalid date:', date);
    }
  },

  // 切换到上一个月
  onPrevMonth() {
    const date = new Date(this.data.currentDate);
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    this.setData({
      currentDate: currentMonth,
      currentYear: year,
      currentMonth: month
    });

    this.loadMonthlyRecords(currentMonth);
  },

  // 切换到下一个月
  onNextMonth() {
    const date = new Date(this.data.currentDate);
    date.setMonth(date.getMonth() + 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    this.setData({
      currentDate: currentMonth,
      currentYear: year,
      currentMonth: month
    });

    this.loadMonthlyRecords(currentMonth);
  },

  // 生成日历数据
  generateCalendarData(month, records) {
    const [year, monthStr] = month.split('-');
    const firstDay = new Date(Date.UTC(year, parseInt(monthStr) - 1, 1));
    const lastDay = new Date(Date.UTC(year, parseInt(monthStr), 0));
    
    // 计算本月总打卡次数
    const monthlyTotal = records.length;
    this.setData({ monthlyTotal });
    
    // 获取上个月的最后几天
    const prevMonthDays = [];
    const firstDayWeekDay = firstDay.getDay();
    if (firstDayWeekDay > 0) {
      const prevMonthLastDay = new Date(Date.UTC(year, parseInt(monthStr) - 2, 0));
      for (let i = firstDayWeekDay - 1; i >= 0; i--) {
        const date = new Date(Date.UTC(year, parseInt(monthStr) - 2, prevMonthLastDay.getDate() - i));
        prevMonthDays.push({
          id: `prev-${date.getTime()}`,  // 添加唯一标识
          date: date.toISOString().split('T')[0],
          dayOfMonth: prevMonthLastDay.getDate() - i,
          isCurrentMonth: false,
          count: 0
        });
      }
    }
    
    // 获取当月的天数
    const currentMonthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(Date.UTC(year, parseInt(monthStr) - 1, day));
      // 找出当天的所有记录
      const dayRecords = records.filter(r => {
        const recordDate = new Date(r.recordTime);
        // recordDate.setMinutes(recordDate.getMinutes() + recordDate.getTimezoneOffset());
        recordDate.setMinutes(recordDate.getMinutes());
        return recordDate.getDate() === day;
      });
      
      currentMonthDays.push({
        id: `current-${currentDate.getTime()}`,  // 添加唯一标识
        date: currentDate.toISOString().split('T')[0],
        dayOfMonth: day,
        isCurrentMonth: true,
        count: dayRecords.length
      });
    }
    
    // 获取下个月的开始几天
    const nextMonthDays = [];
    const lastDayWeekDay = lastDay.getDay();
    if (lastDayWeekDay < 6) {
      for (let i = 1; i <= 6 - lastDayWeekDay; i++) {
        const date = new Date(Date.UTC(year, parseInt(monthStr), i));
        nextMonthDays.push({
          id: `next-${date.getTime()}`,  // 添加唯一标识
          date: date.toISOString().split('T')[0],
          dayOfMonth: i,
          isCurrentMonth: false,
          count: 0
        });
      }
    }
    
    // 将所有天数合并
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    // 按周分组
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    
    return weeks;
  }
});
