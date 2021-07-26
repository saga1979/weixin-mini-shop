
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  properties: {
    _id: {
      type: String,
      value: ''
    },
    editable :{
      type : Boolean,
      value : false
    }
  },
  /**
   * Page initial data
   */
  data: {
    goods_item : {}
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      console.debug(this.data._id)
      let self = this
      wx.cloud.database().collection('goods').doc(this.data._id).get().then(result =>{

        var goodsItem = result.data
        if(goodsItem.isSelling == null){
          goodsItem.isSelling = true
        }
        self.setData({
         goods_item : goodsItem
        })
      }) 

    },
    moved: function () { },
    detached: function () { },
    ready: function () { }
  },



  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show: function () { },
    hide: function () { },
    resize: function () { },
  },

  methods: {




  }
})