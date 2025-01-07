const app = getApp()
const formatTime = require('../../utils/dateUtil.js')

Page({
  data: {
    todoItem: {
      title: '',
      description: '',
      category: '',
      priority: 0,
      dueDate: '',
      dueTime: null,
      reminder: false,
      reminderTime: '',
      repeatType: 'none',
      tags: [],
      attachments: [],
      comments: []
    },
    categories: ['工作', '生活', '学习', '其他'],
    repeatOptions: [
      { value: 'none', label: '不重复' },
      { value: 'daily', label: '每天' },
      { value: 'weekly', label: '每周' },
      { value: 'monthly', label: '每月' }
    ],
    repeatIndex: 0,
    showTagInput: false,
    newTag: '',
    commonTags: ['重要', '紧急', '会议', '出差', '学习'],
    showCommentInput: false,
    newComment: '',
    showTimePicker: false,
    timePickerType: '',
    timePickerValue: [0, 0],
    hours: Array.from({length: 24}, (_, i) => i < 10 ? '0' + i : '' + i),
    minutes: Array.from({length: 60}, (_, i) => i < 10 ? '0' + i : '' + i)
  },

  onLoad(options) {
    if (options.id) {
      this.loadTodoItem(options.id)
    }
  },

  loadTodoItem(id) {
    wx.request({
      url: `${app.globalData.baseUrl}/todoItem/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const todoItem = res.data.data;
          // 格式化时间
          if (todoItem.dueDate) {
            const date = new Date(todoItem.dueDate);
            todoItem.dueDate = formatTime.formatDate(date, 'yyyy-MM-dd');
            todoItem.dueTime = [date.getHours(), date.getMinutes()];
          }
          if (todoItem.reminderTime) {
            const date = new Date(todoItem.reminderTime);
            todoItem.reminderTime = formatTime.formatDate(date, 'HH:mm');
          }
          // 设置附件大小显示
          if (todoItem.attachments) {
            todoItem.attachments = todoItem.attachments.map(attachment => ({
              ...attachment,
              sizeText: this.formatFileSize(attachment.size)
            }));
          }
          this.setData({
            todoItem,
            repeatIndex: this.data.repeatOptions.findIndex(option => option.value === todoItem.repeatType)
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  onTitleInput(e) {
    this.setData({
      'todoItem.title': e.detail.value
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'todoItem.description': e.detail.value
    })
  },

  onCategoryChange(e) {
    this.setData({
      'todoItem.category': this.data.categories[e.detail.value]
    })
  },

  onPriorityChange(e) {
    this.setData({
      'todoItem.priority': parseInt(e.detail.value)
    })
  },

  onDateChange(e) {
    this.setData({
      'todoItem.dueDate': e.detail.value
    })
  },

  onTimeChange(e) {
    this.setData({
      'todoItem.dueTime': e.detail.value.split(':').map(Number)
    })
  },

  onReminderChange(e) {
    this.setData({
      'todoItem.reminder': e.detail.value
    })
  },

  onRepeatChange(e) {
    const index = e.detail.value
    this.setData({
      repeatIndex: index,
      'todoItem.repeatType': this.data.repeatOptions[index].value
    })
  },

  showTagInput() {
    this.setData({ showTagInput: true })
  },

  onTagInput(e) {
    this.setData({ newTag: e.detail.value })
  },

  addTag() {
    if (this.data.newTag && !this.data.todoItem.tags.includes(this.data.newTag)) {
      this.setData({
        'todoItem.tags': [...this.data.todoItem.tags, this.data.newTag],
        newTag: '',
        showTagInput: false
      })
    }
  },

  removeTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.todoItem.tags]
    tags.splice(index, 1)
    this.setData({
      'todoItem.tags': tags
    })
  },

  selectCommonTag(e) {
    const tag = e.currentTarget.dataset.tag
    if (!this.data.todoItem.tags.includes(tag)) {
      this.setData({
        'todoItem.tags': [...this.data.todoItem.tags, tag]
      })
    }
  },

  chooseAttachment() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '选择文件'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.takePhoto()
            break
          case 1:
            this.chooseImage()
            break
          case 2:
            this.chooseFile()
            break
        }
      }
    })
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        this.uploadFile(res.tempFiles[0], 'image')
      }
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        res.tempFiles.forEach(file => {
          this.uploadFile(file, 'image')
        })
      }
    })
  },

  chooseFile() {
    // 微信小程序暂不支持选择普通文件，这里预留接口
    wx.showToast({
      title: '暂不支持选择文件',
      icon: 'none'
    })
  },

  uploadFile(file, type) {
    wx.showLoading({ title: '上传中...' })
    
    // 上传文件到服务器
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/todoItem/upload`,
      filePath: file.tempFilePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 0) {
          const attachment = {
            name: file.name || '未命名',
            url: data.data.url,
            size: file.size,
            type: type,
            sizeText: this.formatFileSize(file.size)
          }
          this.setData({
            'todoItem.attachments': [...this.data.todoItem.attachments, attachment]
          })
        } else {
          wx.showToast({
            title: data.message || '上传失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  formatFileSize(size) {
    if (size < 1024) {
      return size + 'B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + 'KB'
    } else {
      return (size / (1024 * 1024)).toFixed(2) + 'MB'
    }
  },

  removeAttachment(e) {
    const index = e.currentTarget.dataset.index
    const attachments = [...this.data.todoItem.attachments]
    attachments.splice(index, 1)
    this.setData({
      'todoItem.attachments': attachments
    })
  },

  previewImage(e) {
    const { url, index } = e.currentTarget.dataset
    const urls = this.data.todoItem.attachments
      .filter(item => item.type === 'image')
      .map(item => item.url)
    wx.previewImage({
      current: url,
      urls: urls
    })
  },

  downloadFile(e) {
    const { url } = e.currentTarget.dataset
    wx.showLoading({ title: '下载中...' })
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            success: () => {
              console.log('打开文档成功')
            },
            fail: () => {
              wx.saveFile({
                tempFilePath: res.tempFilePath,
                success: () => {
                  wx.showToast({
                    title: '文件已保存',
                    icon: 'success'
                  })
                }
              })
            }
          })
        }
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  showCommentInput() {
    this.setData({ showCommentInput: true })
  },

  onCommentInput(e) {
    this.setData({ newComment: e.detail.value })
  },

  addComment() {
    if (this.data.newComment) {
      wx.request({
        url: `${app.globalData.baseUrl}/todoItem/${this.data.todoItem.id}/comment`,
        method: 'POST',
        data: {
          content: this.data.newComment
        },
        success: (res) => {
          if (res.data.code === 0) {
            this.setData({
              'todoItem.comments': res.data.data.comments,
              newComment: '',
              showCommentInput: false
            })
          } else {
            wx.showToast({
              title: res.data.message || '添加评论失败',
              icon: 'none'
            })
          }
        }
      })
    }
  },

  removeComment(e) {
    const index = e.currentTarget.dataset.index
    wx.request({
      url: `${app.globalData.baseUrl}/todoItem/${this.data.todoItem.id}/comment/${index}`,
      method: 'DELETE',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            'todoItem.comments': res.data.data.comments
          })
        } else {
          wx.showToast({
            title: res.data.message || '删除评论失败',
            icon: 'none'
          })
        }
      }
    })
  },

  onTimePickerShow() {
    this.setData({ showTimePicker: true })
  },

  onTimePickerClose() {
    this.setData({ showTimePicker: false })
  },

  onTimePickerChange(e) {
    this.setData({
      timePickerValue: e.detail.value
    })
  },

  confirmTimePicker() {
    const [hour, minute] = this.data.timePickerValue
    const timeStr = `${this.data.hours[hour]}:${this.data.minutes[minute]}`
    
    if (this.data.timePickerType === 'reminderTime') {
      this.setData({
        'todoItem.reminderTime': timeStr
      })
    }
    
    this.onTimePickerClose()
  },

  saveTodoItem() {
    if (!this.data.todoItem.title) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    
    const url = this.data.todoItem.id ? 
      `${app.globalData.baseUrl}/todoItem/update` :
      `${app.globalData.baseUrl}/todoItem/create`

    wx.request({
      url: url,
      method: 'POST',
      data: this.data.todoItem,
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  }
})
