// cloudfunctions/payment/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event

  try {
    switch (action) {
      case 'createPayment':
        return await createPayment(event, wxContext)
      case 'paymentCallback':
        return await paymentCallback(event)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误', error)
    return { success: false, message: error.message }
  }
}

// 创建支付订单
async function createPayment(event, wxContext) {
  const { orderId } = event
  const openId = wxContext.OPENID

  try {
    // 获取订单信息
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return { success: false, message: '订单不存在' }
    }

    const order = orderResult.data

    // 检查订单状态
    if (order.depositStatus === 'paid') {
      return { success: false, message: '订单已支付' }
    }

    // 调用微信支付统一下单接口
    // 注意：这里需要配置微信支付商户号和密钥
    const paymentResult = await cloud.cloudPay.unifiedOrder({
      body: '任务押金',
      outTradeNo: `${orderId}-${Date.now()}`, // 商户订单号
      spbillCreateIp: '127.0.0.1', // 终端IP
      subMchId: '', // 子商户号，微信支付服务商模式下必填
      totalFee: order.amount * 100, // 金额，单位为分
      envId: cloud.DYNAMIC_CURRENT_ENV, // 微信云开发环境ID
      functionName: 'paymentCallback', // 支付成功回调云函数
      tradeType: 'JSAPI',
      openid: openId
    })

    return {
      success: true,
      data: {
        ...paymentResult,
        orderId
      }
    }
  } catch (error) {
    console.error('创建支付失败', error)
    throw error
  }
}

// 支付回调
async function paymentCallback(event) {
  try {
    const { orderId, returnCode, resultCode } = event

    if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS') {
      // 更新订单状态
      await db.collection('orders').doc(orderId).update({
        data: {
          depositStatus: 'paid'
        }
      })

      // 获取订单信息
      const orderResult = await db.collection('orders').doc(orderId).get()
      const order = orderResult.data

      // 更新任务状态为进行中
      await db.collection('tasks').doc(order.taskId).update({
        data: {
          status: 'in-progress'
        }
      })

      return { success: true }
    }

    return { success: false, message: '支付失败' }
  } catch (error) {
    console.error('支付回调处理失败', error)
    throw error
  }
}

