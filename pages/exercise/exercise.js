const app = getApp()

Page({
  data: {
    exercises: [],
    loading: true
  },

  onLoad() {
    // 页面加载时不需要立即获取数据，在onShow中会获取
  },

  onShow() {
    // 每次显示页面时重新加载数据
    this.fetchExercises()
  },

  // 获取运动项目列表
  fetchExercises() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.baseUrl}/exercise/list`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ 
            exercises: res.data.data || [],
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取数据失败',
            icon: 'none'
          })
          this.setData({ 
            exercises: [],
            loading: false
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
        this.setData({ 
          exercises: [],
          loading: false
        })
      }
    })
  },

  // 跳转到创建运动项目页面
  navigateToCreate() {
    wx.navigateTo({
      url: '/pages/createExercise/createExercise'
    })
  },

  // 跳转到运动项目详情页面
  navigateToDetail(e) {
    const { id, name, type } = e.currentTarget.dataset;
    console.log('运动项目数据:', { id, name, type });
    
    if (type === 'checkin') {
      console.log('检测到打卡型运动，准备跳转到打卡页面');
      // 打卡型运动跳转到打卡页面
      wx.navigateTo({
        url: `/pages/exerciseCheckIn/exerciseCheckIn?id=${id}&name=${name}`,
        success: () => console.log('跳转成功'),
        fail: (error) => console.error('跳转失败:', error)
      });
    } else {
      console.log('非打卡型运动，跳转到详情页面');
      // 计时型运动保持原有逻辑
      wx.navigateTo({
        url: `/pages/exerciseDetail/exerciseDetail?id=${id}&name=${name}`
      });
    }
  },

  goToDetail(e) {
    const { id, name } = e.currentTarget.dataset;
    if (id) {
      wx.navigateTo({
        url: `/pages/exerciseDetail/exerciseDetail?id=${id}&name=${name}`
      });
    }
  }
})
