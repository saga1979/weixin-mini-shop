// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
exports.main = async (request) => {
  console.log(request)

  const wxContext = cloud.getWXContext()
  //判断用户类型
  var res = await db.collection('admin').limit(1).get()
  var data = res.data[0]
  var index = data['admins'].findIndex(item => item == wxContext.OPENID)

  var user = index != -1 ? 'admin' : 'user'

  //用户信息注册
  const userCol = db.collection('users')
  res = await userCol.where({
    openid: wxContext.OPENID
  }).get()

  if (res.data.length == 0) {//新用户
    await userCol.add({
      data: {
        info: {
          avatarUrl: request.userInfo.avatarUrl,
          nickName: request.userInfo.nickName
        },
        openid: wxContext.OPENID
      }
    }).catch(console.error)

  } else {
    if (res.data[0].info.avatarUrl != request.userInfo.avatarUrl
      || res.data[0].info.nickName != request.userInfo.nickName) {
      await userCol.where({
        openid: wxContext.OPENID
      }).update({
        info: {
          avatarUrl: request.userInfo.avatarUrl,
          nickName: request.userInfo.nickName
        }
      }).catch(console.error)
    }

  }
  //返回信息

  return {
    success: true,
    data: {
      user: user,
      openid: wxContext.OPENID
    }
  }
}

