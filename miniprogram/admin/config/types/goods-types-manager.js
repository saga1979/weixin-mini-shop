// miniprogram/admin/goods-types-manager/goods-types-manager.js
Page({

  /**
   * Page initial data
   */
  data: {
    goodsTypes: [],
    _deletedTypes: []

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    wx.showLoading({
      title: '正在获取数据',
    })
    var ret = await wx.cloud.callFunction({
      name: 'config',
      data: {
        cmd: 'goodsTypes-get'
      }
    })
    wx.hideLoading({
      success: (res) => {},
    })
    console.debug(ret.result.data)

    var items = ret.result.data
    if (items == null) {
      return
    }
    for (var index = 0; index < items.length; index++) {
      items[index].buttons = [{
        text: '删除',
        type: 'warn',
        src: '../../../images/trash.png', // icon的路径相对组件的路径，而不是使用者的路径 
        data: items[index]._id,//通过ID删除该条数据
      }]

    }
    this.setData({
      goodsTypes: items
    })
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  onTitleInput: function (e) {
    //e.detail.value : title
    //e.target.dataset.index 控件的data-index
    //e.target.id 控件ID
    var item = this.data.goodsTypes[e.target.dataset.index]
    if (item.old_title == null
      && item.new_stable ==null) {//只保留从数据库读取的记录
      this.data.goodsTypes[e.target.dataset.index].old_title = this.data.goodsTypes[e.target.dataset.index].title
    }
    this.data.goodsTypes[e.target.dataset.index].title = e.detail.value
  },
  onDescInput: function (e) {//只保留从数据库读取的记录,另外，这条记录也不能是新增加的
    var item = this.data.goodsTypes[e.target.dataset.index]
    if (item.old_desc == null
      && item.new_stable ==null) {
      this.data.goodsTypes[e.target.dataset.index].old_desc = this.data.goodsTypes[e.target.dataset.index].desc
    }
    this.data.goodsTypes[e.target.dataset.index].desc = e.detail.value
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
  onUnload: async function () {
    var modifiedTypes = []
    var newTypes = []
    var deletedTypes = []

    console.debug("goodsTypes:", this.data.goodsTypes)

    var deletedImgs = [] //如果更新成功，删除项的图片要从云存储删除
    var uploadedImgs = [] //如果更新不成功，新上传的图片要删除
    var oldImgs = [] //如果更新成功，原有图片要删除

    for (var index = 0; index < this.data.goodsTypes.length; index++) {

      let self = this
      var item = this.data.goodsTypes[index]
      if (item.deleted) {//删除的项只需要索引
        deletedTypes.push(index)
        deletedImgs.push(this.data.goodsTypes[index].img) //保存要删除的图像列表
        continue
      }
      if (Object.keys(item).filter(key => key.startsWith("old_") ).length == 0
        && Object.keys(item).filter(key =>key.startsWith("new_") ).length == 0) {
        continue//忽略没有更改过
      }
      if ( (item.old_title == item.title && item.old_desc == item.desc)//忽略虽然有更改过程但结果与最初数据一致的
      || item.title == ''
      || item.title == null) { //忽略没有标题的
        continue
      }
      var type = {
        title: item.title,
        desc: item.desc,
        img: item.img,
        index : index
      }
      if (!item.img.startsWith("cloud://") || item.old_img != null) {
        wx.showLoading({
          title: '正在上传图片',
        })

        var ret = await wx.cloud.uploadFile({
          cloudPath: item.imgCloud,
          filePath: item.img,
        })
        if(ret.fileID != null){
          uploadedImgs.push(ret.fileID)
        }
        type.img = ret.fileID
        if (item.old_img != null) {
          oldImgs.push(item.old_img) 
        }
        wx.hideLoading({
          success: (res) => {},
        })
      }
      console.debug("type:", type)
      console.debug("keys:", Object.keys(item).filter(key => key.startsWith("old_")) )
      if (Object.keys(item).filter(key => key.startsWith("old_")).length != 0) {
        modifiedTypes.push(type)
      }
      else {
        delete type.index
        newTypes.push(type)
      }
    }

    if (modifiedTypes.length == 0
      && newTypes.length == 0
      && deletedTypes.length == 0) {
      console.debug("没有更改信息")
      return
    }

    wx.showLoading({
      title: '正在变更信息',
    })
    console.debug(modifiedTypes)
    var ret = await wx.cloud.callFunction({
      name: 'config',
      data: {
        cmd: "goodsTypes-set",
        data: {
          modified: modifiedTypes,
          added: newTypes,
          deleted: deletedTypes
        }
      }
    })
    wx.hideLoading({
      success: (res) => {},
    })
    console.debug(ret)
    var imgsTodelete = []
    if(ret.result.success ){
      imgsTodelete = deletedImgs.concat(oldImgs)      
    }else{
      imgsTodelete = uploadedImgs
    }
    if(imgsTodelete.length > 0){
      var ret = await wx.cloud.deleteFile({
        fileList: deletedImgs
      })
      console.debug("已删除:", ret.fileList)
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

  onClickItem: function (e) {
    console.debug(e)
    var index = e.target.dataset.index

    if (e.detail.index == 1) {
      this.setData({
        [`goodsTypes[${index}].editable`]: true
      })

    } else {
      this.data._deletedTypes.push(this.data.goodsTypes[index])
      this.data.goodsTypes[index].deleted = true
      // this.data.goodsTypes.splice(index, 1)
      // this.setData({
      //   goodsTypes: this.data.goodsTypes
      // })
      this.setData({
        [`goodsTypes[${index}].deleted`]: true
      })
    }
  },
  onAddType: async function (e) {
    var ret = null
    try {
      ret = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],//启用压缩模式
        sourceType: ['album', 'camera'],
      })
    } catch { err => { console.error(err) } }

    if (ret == null) {

      wx.showToast({
        title: '类别必须有图片',
        icon : 'none'        
      })

      return
    }
    console.debug("choose image:", ret == null ? "fail" : ret)

    var type = {
      title: "",
      img: ret.tempFilePaths[0],
      desc: '',
      editable: true
    }
    type.buttons = [{
      text: '删除',
      type: 'warn',
      data: type.title,//通过ID删除该条数据
    },
    {
      text: '编辑',
      type: 'primary',
      data: type.title,
    }
    ]

    const cloudPath = "configs/" + Date.now() + "[" + 0 + "]" + type.img.match(/\.[^.]+?$/)[0]
    type.imgCloud = cloudPath
    this.data.goodsTypes.push(type)
    var index = this.data.goodsTypes.length - 1
    this.setData({
      [`goodsTypes[${index}]`]: this.data.goodsTypes[index]
    })
    this.data.goodsTypes[index].new_stable = { index: this.data.goodsTypes.length - 1 }
    console.debug(this.data.goodsTypes)
  },
  onSelectImg: function (e) {
    var index = e.target.dataset.index

    let self = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],//启用压缩模式
      sourceType: ['album', 'camera'],
      success: function (res) {
        //生成UUID，暂时不需要使用，使用时间来区分
        let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
        let guid = [u.substr(0, 8), u.substr(8, 4), '4000-8' + u.substr(13, 3), u.substr(16, 12)].join('-');
        let now = Date.now();
        const cloudPath = "configs/" + now + "[" + 0 + "]" + res.tempFilePaths[0].match(/\.[^.]+?$/)[0]
        console.log(cloudPath)

        self.data.goodsTypes[index].imgCloud = cloudPath

        if (self.data.goodsTypes[index].img.startsWith("cloud://")) {
          self.data.goodsTypes[index].old_img = self.data.goodsTypes[index].img //最后要删除这个旧图片
        }

        self.setData({
          [`goodsTypes[${index}].img`]: res.tempFilePaths[0]
        })
      },
      fail: e => {
        console.error(e)
      }
    })

  }
})