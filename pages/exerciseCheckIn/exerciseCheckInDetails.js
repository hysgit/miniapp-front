const app = getApp();

Page({
  data: {
    date: '',
    checkInTimes: [],
    exerciseId: ''
  },

  onLoad(options) {
    if (options.date) {
      const date = new Date(options.date);
      this.setData({
        date: date.toISOString().split('T')[0],
        exerciseId: options.exerciseId
      });
      this.loadCheckInDetails(date);
    }
  },

  loadCheckInDetails(date) {
    wx.request({
      url: `${app.globalData.baseUrl}/exercise/records/date`,
      method: 'GET',
      data: {
        date: date.toISOString().split('T')[0],
        exerciseId: this.data.exerciseId
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 0) {
          const formattedData = res.data.data.map(item => {
            try {
              if (!item || !item.recordTime) {
                console.warn('Record missing recordTime:', item);
                return { ...item, formattedTime: '' };
              }
              // Handle format "2025-01-07 08:43:13"
              const timePart = item.recordTime.split(' ')[1];  // Get the time part after the space
              const time = timePart.split('.')[0];  // Remove any milliseconds if present
              return { ...item, formattedTime: time };
            } catch (error) {
              console.error('Error formatting time for record:', item, error);
              return { ...item, formattedTime: '' };
            }
          });
          this.setData({ checkInTimes: formattedData });
          console.log(this.data.checkInTimes)
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
      }
    });
  }
});
