// miniprogram/admin/add-item/add-item.js
Page({

  /**
   * Page initial data
   */
  data: {
    _units: ['斤', '箱', '个', '只', '件'],
    _unitIndex: 0,
    _goodsItems: [],
    _addedImgs: [],
    previewImageUrls: [],//图片预览时需要的本地路径数组
    type: '',
    typeIndex: 0,
    recommend: false,
    title: '完善新物品信息'
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

    const eventChannel = this.getOpenerEventChannel()
    var self = this
    if (options.op == "edit") {
      eventChannel.on('edit', function (data) {
        var keys = Object.keys(data.item)
        console.debug("keys:", keys)
        for (var index = 0; index < keys.length; index++) {
          console.debug(keys[index], data.item[keys[index]])
          var key = keys[index]
          self.setData({
            [`${key}`]: data.item[keys[index]]
          })
        }
        self.setData({
          unitIndex: self.data._units.indexOf(data.item.unit),
          previewImageUrls: data.item.imgs,
          _editting: true,
          _oldItem: data.item,
          _deletedImgs: [],
          _types: data.types,
          title: '修改' + data.item.name + '信息'
        })
      })
    } else {
      eventChannel.on('new', function (data) {
        self.setData({
          _types: data.types
        })
      })
    }  
  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

    const eventChannel = this.getOpenerEventChannel()

    if (this.data._editting) {
      eventChannel.emit('updated', {
        items: this.data._goodsItems
      })

    } else {
      eventChannel.emit('goodsAdded', {
        num: this.data._goodsItems.length,
        items: this.data._goodsItems
      })
    }
    console.debug(this.data._goodsItems)
  },

  bindUnitChange: function (e) {
    this.setData({
      unit: this.data._units[e.detail.value]
    })
  },

  bindTypeChanged: function (e) {
    this.setData({
      type: this.data._types[e.detail.value]
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
          self.data.imgs.push(res.tempFilePaths[index])
          self.data.previewImageUrls.push(res.tempFilePaths[index])
          self.data._addedImgs.push({
            local: res.tempFilePaths[index],
            remote: cloudPath
          })
        }
        self.setData({
          imgs: self.data.imgs
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
    console.debug(e.detail.index)
    var index = this.data._addedImgs.findIndex(
      item => item.local == this.data.imgs[e.detail.index])
    if (index != -1) {
      this.data._addedImgs.splice(e.detail.index, 1)
    } else {
      this.data._deletedImgs.push(this.data.imgs[e.detail.index])
    }
    this.data.imgs.splice(e.detail.index, 1)
    this.data.previewImageUrls.splice(e.detail.index, 1)
    this.setData({
      imgs: this.data.imgs,
      previewImageUrls: this.data.previewImageUrls
    })
  },
  /**
   * 点击“确定”按钮后，将数据写入数据库。退出页面时，将该商品信息对象传递给商品列表页面。
   * @param {} e 
   */
  onUpdateItem: async function (e) {

    if (this.data.imgs.length == 0) {
      wx.showModal({
        title: '必须设置图片',
      })
      return
    }
    var imgsIDs = []
    let uploaded = 0
    for (var index in this.data._addedImgs) {
      wx.showLoading({
        title: `上传图片${index}/${this.data._addedImgs.length}`
      })
      var remote = this.data._addedImgs[index].remote
      var local = this.data._addedImgs[index].local

      var res = await wx.cloud.uploadFile({
        remote, local
      })

      if (res.fileID != null) {
        uploaded++
        imgsIDs.push(res.fileID)
        console.debug('[上传文件] :', cloudPath, filePath)
      }
    }

    wx.showLoading({
      title: "正在更新数据",
    })
    var cmd = 'set'
    var record = {}
    record.imgs = []
    if (this.data._editting) {
      cmd = 'update'
      //图片集合更新为新增的图片集合+（原有图片集合-删除的图片集合）
      //var deletedImgs = this.data._deletedImgs
      //var imgs = this.data.imgs.filter(img => deletedImgs.indexof(img) == -1)
      //record.imgs.push(imgs)
      record.imgs = this.data.imgs
    }

    record.imgs = record.imgs.concat(imgsIDs)
    record.name = this.data.name
    record.des = this.data.des
    record.unit = this.data.unit
    record.price = this.data.price
    record.recommend = this.data.recommend
    record.type = this.data.type
    var data = {
      cmd: cmd,
      data: record
    }

    if (this.data._editting) {
      //原有记录的ID
      data._id = this.data._id
    }
    res = await wx.cloud.callFunction({
      name: 'goods-op',
      data: data
    })
    console.debug(res)

    wx.hideLoading()
    var self = this
    if (res.result.success) {
      var goodsItem = data.data
      goodsItem._id = res.result.data
      self.data._goodsItems.push(goodsItem)
      if (self.data._editting
        && self.data._deletedImgs.length > 0) {
        var res = await wx.cloud.deleteFile({
          fileList: self.data._deletedImgs
        })
        console.debug("del:", res)
      }
      console.debug("goods item:", goodsItem)
      wx.navigateBack({
        delta: 1,
      })

    } else {
      //如果不能成功更新数据库，需要删除已经上传到云存储的图片
      wx.cloud.deleteFile({
        fileList: imgsIDs,
        success: res => {
          console.debug(res.fileList)
        },
        fail: console.error
      })
      wx.showToast({
        title: '上传数据失败',
        icon: 'none'
      })
    }
  },
})