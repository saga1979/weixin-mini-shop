// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({

  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (request) => {
  console.log("requst:", request)
  const wxContext = cloud.getWXContext()

  const collection = db.collection('goods')
  let success = false
  switch (request.cmd) {
    case "set":

      var data = request.data
      data.openid = wxContext.OPENID
      if (data.date != null) {
        data.date = new Date(data.date)
      }
      await collection.add({
        data: data
      }).then(result => {
        success = true
        data = result._id
      }).catch(err => {
        console.error(err)
        data = { err }
      })

      return {
        success: success ? true : false,
        data: data
      }

    case "update":
      try {
        collection.where({
          _id: request.id
        }).update({
          data: request.data
        })
      } catch (e) {
        console.error(e)
        return {
          success: false
        }
      }
      return {
        success: true,
        data : request.id
      }

    case "delete":
      await collection.where({
        _id: request.data.id
      }).remove().then(result => {
        success = true
        return result.stats.removed
      }).catch(err => {
        console.log(err)
      })
      return {
        success: success,
        msg: success ? "成功" : "去看云函数记录吧"
      }

    case "get": {

      var res = null
      if (request.data != null && request.data.where != null) {
        res = await collection.where(request.data.where).get()
      } else {
        res = await collection.get()
      }

      if (res.data.length > 0) {
        success = true
      }
      return {
        success: success,
        data: res.data
      }
    }

    default:
      return {
        success: false,
        msg: "不支持的操作"
      };

  }


}