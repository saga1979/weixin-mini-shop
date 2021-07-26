// miniprogram/admin/recommend/recommend.js
Page({

  /**
   * Page initial data
   */
  data: {
    _old : []
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {

    wx.showLoading({
      title: '正在加载数据',
    })

    var res = await wx.cloud.callFunction({
      name: 'goods-op',
      data: {
        cmd: 'get'
      }
    })
    wx.hideLoading({
      success: (res) => { },
    })

    if (!res.result.success) {
      wx.showToast({
        title: '数据为空',
      })
      return
    }

    this.setData({
      goodsInfos: res.result.data
    })
    for (var index = 0; index < this.data.goodsInfos.length; index++) {
      this.data._old.push(this.data.goodsInfos[index].recommend)     
    }
    
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

    var onList = []
    var offList = []

    for (var index = 0; index < this.data.goodsInfos.length; index++) {
      if (this.data.goodsInfos[index].recommend == this.data._old[index]) {
        continue
      }

      if (!this.data._old[index]) {
        onList.push(this.data.goodsInfos[index]._id)
      }
      else {
        offList.push(this.data.goodsInfos[index]._id)
      }
    }

    if(onList.length == 0 && offList.length == 0){
      return
    }

    console.debug("onList:", onList)
    console.debug("offList:", offList)
    wx.cloud.callFunction({
      name : 'goods-op',
      data :{
        cmd : 'update-recommend',
        onList : onList,
        offList : offList
      }
    }).then(res=>{
      console.debug(res)

    }).catch(err =>{
      console.error(err)
    })

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  },
  goodsOnorOff: function (e) {
    console.debug(e)
    this.data.goodsInfos[e.target.dataset.index].recommend = e.detail.value
  }
})