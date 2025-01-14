Page({
  data: {
    name: '',
    typeIndex: 0,
    typeOptions: ['单次', '周循环', '月循环', '年循环', '日循环', '6个月循环', '3个月循环', '4个月循环'],
    endDate: '',
    endTime: '00:00'
  },

  onLoad: function() {
    // 设置默认的结束日期为今天
    const today = new Date();
    const dateStr = this.formatDate(today);
    this.setData({
      endDate: dateStr
    });
  },

  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onTypeChange: function(e) {
    this.setData({
      typeIndex: e.detail.value
    });
  },

  onEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  onEndTimeChange: function(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  onSubmit: function() {
    const { name, typeIndex, endDate, endTime } = this.data;
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入倒计时名称',
        icon: 'none'
      });
      return;
    }

    const endDateTime = `${endDate} ${endTime}:00`;

    // 检查结束时间是否大于当前时间
    if (new Date(endDateTime) <= new Date()) {
      wx.showToast({
        title: '结束时间必须大于当前时间',
        icon: 'none'
      });
      return;
    }

    const countdown = {
      name: name,
      countdownType: Number(typeIndex) + 1, // 类型从1开始计数，使用Number()确保是数字加法
      endTime: endDateTime
    };

    // 发送请求创建倒计时
    wx.request({
      url: `${getApp().globalData.baseUrl}/countdown/create`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: countdown,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '创建成功',
            icon: 'success',
            duration: 2000
          });
          // 返回上一页并刷新列表
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 2000);
        } else {
          wx.showToast({
            title: '创建失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        });
      }
    });
  }
});
