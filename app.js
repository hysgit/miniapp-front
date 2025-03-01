App({
  globalData: {
    baseUrl: 'https://miniapp.woslx.com', // 开发测试地址
    token: null,
    loginPromise: null, // 存储登录Promise
    isLoginning: false // 标记是否正在登录中
  },

  onLaunch() {
    this.checkLocalLoginState()
  },

  // 检查本地登录状态
  checkLocalLoginState() {
    const token = wx.getStorageSync('token')
    const tokenExpireTime = wx.getStorageSync('tokenExpireTime')
    
    if (token && tokenExpireTime && new Date().getTime() < tokenExpireTime) {
      // token未过期，直接使用
      this.globalData.token = token
      this.globalData.userInfo = wx.getStorageSync('userInfo')
      this.globalData.hasUserInfo = true
      this.setupRequestInterceptor()
    } else {
      // token不存在或已过期，需要重新登录
      this.login()
    }
  },

  // 登录方法
  login() {
    if (this.globalData.isLoginning) {
      return this.globalData.loginPromise
    }

    this.globalData.isLoginning = true
    this.globalData.loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (res.code) {
            wx.request({
              url: this.globalData.baseUrl + '/user/login',
              method: 'POST',
              data: {
                code: res.code
              },
              success: (res) => {
                if (res.statusCode === 200 && res.data.code === 0) {
                  const { token, user } = res.data.data
                  // 计算7天后的时间戳
                  const expireTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                  
                  // 存储登录信息
                  wx.setStorageSync('token', token)
                  wx.setStorageSync('userInfo', user)
                  wx.setStorageSync('tokenExpireTime', expireTime)
                  
                  this.globalData.token = token
                  this.globalData.userInfo = user
                  this.globalData.hasUserInfo = true
                  
                  this.setupRequestInterceptor()
                  resolve(res.data)
                } else {
                  reject(new Error('登录失败'))
                }
              },
              fail: reject,
              complete: () => {
                this.globalData.isLoginning = false
              }
            })
          } else {
            this.globalData.isLoginning = false
            reject(new Error('获取code失败'))
          }
        },
        fail: (err) => {
          this.globalData.isLoginning = false
          reject(err)
        }
      })
    })

    return this.globalData.loginPromise
  },

  // 设置请求拦截器
  setupRequestInterceptor() {
    const originalRequest = wx.request
    Object.defineProperty(wx, 'request', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (options) => {
        // 添加token到header
        const header = {
          ...options.header,
          'X-Token': this.globalData.token || ''
        }

        // 处理401错误
        const originalSuccess = options.success
        const originalFail = options.fail
        
        const handleResponse = async (res) => {
          if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
            // 清除本地存储的登录信息
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('tokenExpireTime')
            
            try {
              // 重新登录
              await this.login()
              
              // 使用新token重新发起原来的请求
              return new Promise((resolve, reject) => {
                wx.request({
                  ...options,
                  header: {
                    ...options.header,
                    'X-Token': this.globalData.token
                  },
                  success: (retryRes) => {
                    // 如果重试请求还是返回401，说明可能是其他问题，直接调用原始失败回调
                    if (retryRes.statusCode === 401 || (retryRes.data && retryRes.data.code === 401)) {
                      console.error('重新登录后请求仍然返回401')
                      if (originalFail) {
                        originalFail(retryRes)
                      }
                      reject(retryRes)
                      return
                    }
                    
                    // 重试成功，调用原始成功回调
                    if (originalSuccess) {
                      originalSuccess(retryRes)
                    }
                    resolve(retryRes)
                  },
                  fail: (err) => {
                    console.error('重试请求失败:', err)
                    if (originalFail) {
                      originalFail(err)
                    }
                    reject(err)
                  }
                })
              })
            } catch (err) {
              console.error('重新登录失败:', err)
              // 跳转到登录页面并保存回调，等用户手动登录后可以继续之前的操作
              this.globalData.loginCallback = () => {
                wx.request({
                  ...options,
                  header: {
                    ...options.header,
                    'X-Token': this.globalData.token
                  }
                })
              }
              wx.navigateTo({
                url: '/pages/login/login'
              })
              if (originalFail) {
                originalFail(err)
              }
              return Promise.reject(err)
            }
          } else if (originalSuccess) {
            originalSuccess(res)
          }
          return Promise.resolve(res)
        }

        return originalRequest({
          ...options,
          header,
          success: handleResponse,
          fail: (err) => {
            if (originalFail) {
              originalFail(err)
            }
          }
        })
      }
    })
  },
  
  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          this.globalData.hasUserInfo = true
          wx.setStorageSync('userInfo', res.userInfo)
          resolve(res.userInfo)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
})
