// admin/config/config.js
Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  /**
   * Component properties
   */
  properties: {
    openid: String,
    height: String
  },


  /**
   * Component initial data
   */
  data: {
    functions: [
      {
        title: "类别",
        url: "../config/types/goods-types-manager"
      },
      {
        title: "推荐",
        url: "../config/recommend/recommend"
      }
    ],
  
    
  },

  lifetimes: {
    attached:  function () {
    },
    ready: function () {

    },
    moved: function () { },
    detached: function () { },

  },

  /**
   * Component methods
   */
  methods: {

    onClickFunction: function (e) {
      console.debug(e)
      wx.navigateTo({
        url: this.data.functions[e.target.dataset.index].url,
      })
    }

  }
})
