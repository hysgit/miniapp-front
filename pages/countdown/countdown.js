Page({
  data: {
    countdown: 10
  },
  onLoad() {
    this.startCountdown();
  },
  startCountdown() {
    const interval = setInterval(() => {
      if (this.data.countdown > 0) {
        this.setData({
          countdown: this.data.countdown - 1
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }
});
