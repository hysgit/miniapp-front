// 日期工具函数
const dateUtil = {
  /**
   * 将日期字符串转换为iOS兼容的格式
   * @param {string} dateStr - 日期字符串，格式如 "2025-01-07 08:43:13"
   * @returns {Date} 返回Date对象
   */
  parseDate: function(dateStr) {
    if (!dateStr) return null;
    // 将 "2025-01-07 08:43:13" 转换为 "2025-01-07T08:43:13"
    return new Date(dateStr.replace(' ', 'T'));
  },

  /**
   * 格式化日期为指定格式
   * @param {Date} date - Date对象
   * @param {string} format - 输出格式，默认为 "yyyy-MM-dd"
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(date, format = 'yyyy-MM-dd') {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 计算时间差（秒）
   * @param {string} startTimeStr - 开始时间字符串
   * @returns {number} 时间差（秒）
   */
  calculateTimeDiff: function(startTimeStr) {
    const startDate = this.parseDate(startTimeStr);
    if (!startDate) return 0;
    
    const now = new Date();
    return Math.floor((now - startDate) / 1000);
  }
};

module.exports = dateUtil;
