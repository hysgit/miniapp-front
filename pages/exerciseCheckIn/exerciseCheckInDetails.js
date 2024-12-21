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
            const time = item.recordTime.split('T')[1].split('.')[0];
            return { ...item, formattedTime: time };
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
