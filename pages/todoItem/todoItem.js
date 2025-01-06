// pages/todoItem/todoItem.js
Page({
  data: {
    todoItem: {
      title: '',
      description: '',
      priority: 0,  // 0: 普通, 1: 重要
      dueDate: '',
      dueTime: '',
      category: '',
      reminder: false,
      reminderTime: '',
      repeatType: 'none', // none, daily, weekly, monthly
      tags: [],
      attachments: [],
      comments: [],
      status: 0     // 0: 未完成, 1: 已完成
    },
    isEdit: false,
    categories: ['工作', '生活', '学习', '其他'],
    repeatOptions: [
      { value: 'none', label: '不重复' },
      { value: 'daily', label: '每天' },
      { value: 'weekly', label: '每周' },
      { value: 'monthly', label: '每月' }
    ],
    repeatIndex: 0,
    commonTags: ['重要', '紧急', '个人', '工作', '会议', '学习', '购物', '娱乐'],
    newTag: '',
    showTagInput: false,
    showAttachmentPicker: false,
    showCommentInput: false,
    newComment: '',
    showTimePicker: false,
    currentPickerType: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true })
      this.loadTodoItem(options.id)
    }
    wx.setNavigationBarTitle({
      title: this.data.isEdit ? '编辑待办' : '新建待办'
    })
  },

  loadTodoItem(id) {
    wx.showLoading({ title: '加载中...' })
    wx.request({
      url: `${getApp().globalData.baseUrl}/todoItem/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const todoItem = res.data.data
          if (todoItem.reminderTime) {
            todoItem.reminder = true
          }
          // 找到对应的重复选项索引
          const repeatIndex = this.data.repeatOptions.findIndex(
            item => item.value === todoItem.repeatType
          )
          this.setData({
            todoItem,
            repeatIndex: repeatIndex !== -1 ? repeatIndex : 0
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
      },
      complete: () => {
        wx.hideLoading()
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

  onDateChange(e) {
    this.setData({
      'todoItem.dueDate': e.detail.value
    })
  },

  onTimeChange(e) {
    this.setData({
      'todoItem.dueTime': e.detail.value
    })
  },

  onTimePickerShow(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      showTimePicker: true,
      currentPickerType: type
    })
  },

  onTimePickerClose() {
    this.setData({
      showTimePicker: false
    })
  },

  onTimePickerConfirm(e) {
    const { currentPickerType } = this.data
    this.setData({
      [`todoItem.${currentPickerType}`]: e.detail.value,
      showTimePicker: false
    })
  },

  onPriorityChange(e) {
    this.setData({
      'todoItem.priority': parseInt(e.detail.value)
    })
  },

  onCategoryChange(e) {
    this.setData({
      'todoItem.category': this.data.categories[e.detail.value]
    })
  },

  onReminderChange(e) {
    this.setData({
      'todoItem.reminder': e.detail.value
    })
    if (!e.detail.value) {
      this.setData({
        'todoItem.reminderTime': ''
      })
    }
  },

  onTagInput(e) {
    this.setData({
      newTag: e.detail.value
    })
  },

  addTag() {
    const { newTag, todoItem } = this.data
    if (newTag && !todoItem.tags.includes(newTag)) {
      this.setData({
        'todoItem.tags': [...todoItem.tags, newTag],
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
    const { todoItem } = this.data
    if (!todoItem.tags.includes(tag)) {
      this.setData({
        'todoItem.tags': [...todoItem.tags, tag]
      })
    }
  },

  formatFileSize(size) {
    return (size / 1024).toFixed(1) + 'KB'
  },

  chooseAttachment() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        wx.uploadFile({
          url: `${getApp().globalData.baseUrl}/todoItem/upload`,
          filePath: file.path,
          name: 'file',
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data)
            if (data.code === 0) {
              this.setData({
                'todoItem.attachments': [
                  ...this.data.todoItem.attachments,
                  {
                    name: file.name,
                    url: data.data.url,
                    size: file.size,
                    sizeText: this.formatFileSize(file.size)
                  }
                ]
              })
            }
          }
        })
      }
    })
  },

  removeAttachment(e) {
    const index = e.currentTarget.dataset.index
    const attachments = [...this.data.todoItem.attachments]
    attachments.splice(index, 1)
    this.setData({
      'todoItem.attachments': attachments
    })
  },

  onCommentInput(e) {
    this.setData({
      newComment: e.detail.value
    })
  },

  addComment() {
    const { newComment, todoItem } = this.data
    if (newComment.trim()) {
      this.setData({
        'todoItem.comments': [
          ...todoItem.comments,
          {
            content: newComment,
            time: new Date().toISOString(),
            user: getApp().globalData.userInfo
          }
        ],
        newComment: '',
        showCommentInput: false
      })
    }
  },

  removeComment(e) {
    const index = e.currentTarget.dataset.index
    const comments = [...this.data.todoItem.comments]
    comments.splice(index, 1)
    this.setData({
      'todoItem.comments': comments
    })
  },

  onRepeatChange(e) {
    const index = e.detail.value
    const repeatType = this.data.repeatOptions[index].value
    this.setData({
      'todoItem.repeatType': repeatType,
      repeatIndex: index
    })
  },

  validateForm() {
    const { title, dueDate, reminder, reminderTime } = this.data.todoItem
    if (!title || title.trim() === '') {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return false
    }
    if (reminder && !reminderTime) {
      wx.showToast({
        title: '请设置提醒时间',
        icon: 'none'
      })
      return false
    }
    if (reminder && reminderTime) {
      const reminderDateTime = new Date(dueDate + ' ' + reminderTime)
      if (reminderDateTime < new Date()) {
        wx.showToast({
          title: '提醒时间不能早于当前时间',
          icon: 'none'
        })
        return false
      }
    }
    return true
  },

  saveTodoItem() {
    if (!this.validateForm()) {
      return
    }

    const todoData = { ...this.data.todoItem }
    
    // 组合日期和时间
    if (todoData.dueDate && todoData.dueTime) {
      todoData.dueDate = `${todoData.dueDate} ${todoData.dueTime}:00`
    }

    // 删除不需要的字段
    delete todoData.dueTime
    delete todoData.dueDateStr

    wx.showLoading({ title: '保存中...' })
    const url = `${getApp().globalData.baseUrl}/todoItem/${this.data.isEdit ? 'update' : 'create'}`
    
    wx.request({
      url,
      method: this.data.isEdit ? 'PUT' : 'POST',
      data: todoData,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          
          // 如果设置了提醒，创建本地提醒
          if (todoData.reminder && todoData.dueDate) {
            this.createLocalReminder(res.data)
          }

          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  createLocalReminder(todoItem) {
    const reminderDateTime = new Date(todoItem.dueDate)
    wx.requestSubscribeMessage({
      tmplIds: ['your-template-id'],
      success: (res) => {
        if (res['your-template-id'] === 'accept') {
          const reminder = {
            id: todoItem.id,
            title: todoItem.title,
            reminderTime: reminderDateTime.getTime(),
            repeatType: todoItem.repeatType
          }
          wx.setStorage({
            key: `reminder_${todoItem.id}`,
            data: reminder
          })
          if (todoItem.repeatType !== 'none') {
            this.scheduleNextReminder(reminder)
          }
        }
      }
    })
  },

  scheduleNextReminder(reminder) {
    const currentTime = reminder.reminderTime
    let nextTime

    switch (reminder.repeatType) {
      case 'daily':
        nextTime = currentTime + 24 * 60 * 60 * 1000
        break
      case 'weekly':
        nextTime = currentTime + 7 * 24 * 60 * 60 * 1000
        break
      case 'monthly':
        const date = new Date(currentTime)
        date.setMonth(date.getMonth() + 1)
        nextTime = date.getTime()
        break
    }

    if (nextTime) {
      const nextReminder = {
        ...reminder,
        reminderTime: nextTime
      }
      wx.setStorage({
        key: `next_reminder_${reminder.id}`,
        data: nextReminder
      })
    }
  }
})
