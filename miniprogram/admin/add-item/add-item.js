// miniprogram/admin/add-item/add-item.js
Page({

  /**
   * Page initial data
   */
  data: {
    goodsName: '',
    goodsDes: '',
    units: ['斤', '箱', '个', '只', '件'],
    unitIndex: 0,
    goodsPrice: 0,
    imageUrls: [], //对象数组，包含图片的网络路径和本地路径
    previewImageUrls: [],//图片预览时需要的本地路径数组
    _goodsItems: []

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    let self = this
    if (options.op == "edit") {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.on('showItem', function (data) {
        console.debug(data)
        data.imgs.forEach(img => {
          self.data.imageUrls.push({ file: img })
        })
        self.setData({
          goodsName: data.name,
          goodsDes: data.des,
          _id: data._id,
          unitIndex: self.data.units.indexOf(data.unit),
          previewImageUrls: data.imgs,
          imageUrls: self.data.imageUrls,
          _editting: true,
          goodsPrice: data.price,
          _oldItem: data,
          _deletedImgs: []
        })
      })


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

    const eventChannel = this.getOpenerEventChannel()

    if (this.data._editting) {
      // var data = {}
      // var keys = Object.keys(this.data).filter(key => !key.startsWith("_"))

      // console.debug("keys:",keys)
      // for (var index = 0; index < keys.length; index++) {
      //   if (this.data._oldItem[keys[index]] != null 
      //     &&this.data[keys[index]] != this.data._oldItem[keys[index]]) {
      //     data[keys[index]] = this.data[keys[index]]
      //   }
      // }
      // if (Object.keys(data).length == 0) {
      //   console.debug("没有更改商品信息")
      //   return
      // }
      // this.onUpdateItem('unload')
      eventChannel.emit('updated', {
        items: this.data._goodsItems
      })

    } else {
      eventChannel.emit('goodsAdded', {
        num: this.data._goodsItems.length,
        items: this.data._goodsItems
      })
      console.debug(this.data._goodsItems)

    }


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
  bindUnitChange: function (e) {
    this.setData({
      unitIndex: e.detail.value
    })
  },
  onSelectImg: function () {
    let self = this
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],//启用压缩模式
      sourceType: ['album', 'camera'],
      success: function (res) {
        //使用时间+后缀的方式来区分不同图片
        let now = Date.now();
        for (var index = 0; index < res.tempFilePaths.length; index++) {
          const cloudPath = "goods/" + now + "[" + index + "]" + res.tempFilePaths[index].match(/\.[^.]+?$/)[0]
          self.data.imageUrls.push({
            path: cloudPath,
            file: res.tempFilePaths[index]
          })
          self.data.previewImageUrls.push(res.tempFilePaths[index])
        }
        self.setData({
          imageUrls: self.data.imageUrls
        })
      },
      fail: e => {
        console.error(e)
      }
    })
  },
  onPreviewImage: function (e) {
    this.setData({
      isPreviewing: true,
      previewCurrent: e.currentTarget.dataset.index,
      previewImageUrls: this.data.previewImageUrls
    })
  },
  onDeletePic: function (e) {
    if (this.data._editting) {
      this.data._deletedImgs.push(this.data.imageUrls[e.detail.index].file)
    }
    console.debug(e.detail.index)
    this.data.imageUrls.splice(e.detail.index, 1)
    this.data.previewImageUrls.splice(e.detail.index, 1)
    this.setData({
      imageUrls: this.data.imageUrls,
      previewImageUrls: this.data.previewImageUrls
    })
  },
  onUpdateItem: async function (e) {

    if (this.data.imageUrls.length == 0) {
      wx.showModal({
        title: '必须设置图片',
      })
      return
    }

    var self = this
    var imgsID = [];
    let uploaded = 0;
    for (var index in this.data.imageUrls) {
      let filePath = this.data.imageUrls[index].file

      if (filePath.startsWith("cloud:")) {
        uploaded++;
        imgsID.push(filePath)
        continue// todo
      }
      wx.showLoading({
        title: `上传图片${index}/${this.data.imageUrls.length}`,
      })
      let cloudPath = this.data.imageUrls[index].path
      var res = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })

      if (res.fileID != null) {
        uploaded++
        imgsID.push(res.fileID)
        console.debug('[上传文件] :', cloudPath, filePath)
      }

    }
    wx.showLoading({
      title: "正在更新数据",
    })
    var cmd = 'set'
    if (this.data._editting) {
      cmd = 'update'
    }
    var data = {
      cmd: cmd,
      data: {
        name: self.data.goodsName,
        des: self.data.goodsDes,
        imgs: imgsID,
        unit: self.data.units[self.data.unitIndex],
        price: self.data.goodsPrice,
      }
    }
    if (this.data._editting) {
      data.id = self.data._id
    }
    res = await wx.cloud.callFunction({
      name: 'goods-op',
      data: data
    })

    wx.hideLoading()

    if (res.result.success) {
      var goodsItem = data.data
      goodsItem._id = res.result.data
      self.data._goodsItems.push(goodsItem)
      if (!self.data._editting) {
        self.setData({
          goodsName: '',
          goodsDes: '',
          imageUrls: [],
          goodsPrice: 0,
          isPreviewing: false,
          previewImageUrls: []
        })
      } else {
        var res = await wx.cloud.deleteFile({
          fileList: this.data._deletedImgs          
        })
        console.debug("del:", res)
        wx.navigateBack({
          delta: 1,
        })
      }
    } else {
      //删除原来上传的图片
      wx.cloud.deleteFile({
        fileList: imgsID,
        success: res => {
          console.debug(res.fileList)
        },
        fail: console.error
      })
      wx.showToast({
        title: '未能成功添加信息',
        icon: 'none'
      })
    }

  },
})