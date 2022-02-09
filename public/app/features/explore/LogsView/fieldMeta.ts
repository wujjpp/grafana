/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import _ from 'lodash';

// ------------------下面代码从log-backend-datasource中复制而来-------------------------
interface MatchedItem {
  name: string;
  type: MatchedType;
  location: Location;
  description: string;
}

enum Location {
  local = 'local',
  remote = 'remote',
  autoComplete = 'autoComplete',
}

enum MatchedType {
  field = 'field',
  func = 'func',
  value = 'value',
}

const fieldsFromBackendDataSourcePlugin: MatchedItem[] = [
  { name: '@version ', type: MatchedType.field, description: '', location: Location.local },
  { name: 'appName', type: MatchedType.field, description: '应用名称', location: Location.local },
  { name: 'category', type: MatchedType.field, description: '日志归类', location: Location.local },
  { name: 'env', type: MatchedType.field, description: '运行环境', location: Location.local },
  { name: 'host', type: MatchedType.field, description: '', location: Location.local },
  { name: 'level', type: MatchedType.field, description: '日志等级', location: Location.local },
  { name: 'time', type: MatchedType.field, description: '日志时间（unix time in ms）', location: Location.local },
  { name: 'logId', type: MatchedType.field, description: '日志ID', location: Location.local },
  {
    name: '__time__',
    type: MatchedType.field,
    description: '日志入库时间（unix time in seconds）',
    location: Location.local,
  },
  {
    name: '__source__',
    type: MatchedType.field,
    description: '采集机IP地址（logtail）',
    location: Location.local,
  },
  { name: 'type', type: MatchedType.field, description: '', location: Location.local },
  { name: 'version', type: MatchedType.field, description: '应用版本', location: Location.local },
  { name: 'fields.message', type: MatchedType.field, description: '通用信息', location: Location.local },
  { name: 'fields.error.name', type: MatchedType.field, description: '错误名称', location: Location.local },
  { name: 'fields.error.code', type: MatchedType.field, description: '错误代码', location: Location.local },
  { name: 'fields.error.errno', type: MatchedType.field, description: '错误码', location: Location.local },
  { name: 'fields.error.message', type: MatchedType.field, description: '错误信息', location: Location.local },
  { name: 'fields.error.stack', type: MatchedType.field, description: '错误stack trace', location: Location.local },
  { name: 'fields.eventType', type: MatchedType.field, description: '事件名称', location: Location.local },
  {
    name: 'fields.http.contentLength',
    type: MatchedType.field,
    description: 'http body长度',
    location: Location.local,
  },
  { name: 'fields.http.httpStatus', type: MatchedType.field, description: 'http状态码', location: Location.local },
  { name: 'fields.http.responseTime', type: MatchedType.field, description: 'http耗时', location: Location.local },

  // 目标服务相关
  {
    name: 'fields.serverInfo.host',
    type: MatchedType.field,
    description: '服务IP或域名',
    location: Location.local,
  },
  {
    name: 'fields.serverInfo.port',
    type: MatchedType.field,
    description: '服务端口号',
    location: Location.local,
  },
  {
    name: 'fields.serverInfo.user',
    type: MatchedType.field,
    description: '连接用户',
    location: Location.local,
  },
  {
    name: 'fields.serverInfo.database',
    type: MatchedType.field,
    description: '连接数据库',
    location: Location.local,
  },

  // 目标服务查询信息相关
  {
    name: 'fields.serverQueryInfo.query',
    type: MatchedType.field,
    description: '查询语句',
    location: Location.local,
  },
  {
    name: 'fields.serverQueryInfo.start',
    type: MatchedType.field,
    description: '查询开始时间',
    location: Location.local,
  },
  {
    name: 'fields.serverQueryInfo.end',
    type: MatchedType.field,
    description: '查询结束时间',
    location: Location.local,
  },
  {
    name: 'fields.serverQueryInfo.action',
    type: MatchedType.field,
    description: '执行操作类型',
    location: Location.local,
  },
  {
    name: 'fields.serverQueryInfo.collection',
    type: MatchedType.field,
    description: 'MongoDB集合',
    location: Location.local,
  },
  {
    name: 'fields.serverQueryInfo.searchIndex',
    type: MatchedType.field,
    description: '慢查询ES索引',
    location: Location.local,
  },

  // 目标服务重试相关
  {
    name: 'fields.retryInfo.retryCount',
    type: MatchedType.field,
    description: '重连次数',
    location: Location.local,
  },
  {
    name: 'fields.retryInfo.delay',
    type: MatchedType.field,
    description: '重连时间间隔',
    location: Location.local,
  },
  {
    name: 'fields.retryInfo.totalRetryTime',
    type: MatchedType.field,
    description: '自断开后尝试重连总时间',
    location: Location.local,
  },

  // 请求上下文相关
  {
    name: 'fields.requestContext.appVersion',
    type: MatchedType.field,
    description: '当前请求来自?（包含应用名称及版本）',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.accessToken',
    type: MatchedType.field,
    description: 'app端请求的accessToken',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.body',
    type: MatchedType.field,
    description: '请求body参数',
    location: Location.local,
  },
  { name: 'fields.requestContext.clientIp', type: MatchedType.field, description: '远端IP', location: Location.local },
  {
    name: 'fields.requestContext.clientRealIp',
    type: MatchedType.field,
    description: '客户端真实IP',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.currentAppName',
    type: MatchedType.field,
    description: '当前应用名称',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.currentClusterName',
    type: MatchedType.field,
    description: '当前应用所在集群名称（运维注入）',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.currentContainerName',
    type: MatchedType.field,
    description: '当前应用所在容器名称（容器主机名）',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.currentNodeName',
    type: MatchedType.field,
    description: '当前应用所在节点名称（运维注入）',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.deviceId',
    type: MatchedType.field,
    description: '设备ID，对于Web类应用该栏位为SessionID',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.deviceType',
    type: MatchedType.field,
    description: '设备类型',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.functionName',
    type: MatchedType.field,
    description: '功能名称',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.headers',
    type: MatchedType.field,
    description: '当前请求headers',
    location: Location.local,
  },
  { name: 'fields.requestContext.hop', type: MatchedType.field, description: '请求链层级', location: Location.local },
  {
    name: 'fields.requestContext.isSvip',
    type: MatchedType.field,
    description: '当前用户是否为SVIP',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.isVip',
    type: MatchedType.field,
    description: '当前用户是否为VIP',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.isXhr',
    type: MatchedType.field,
    description: '是否为ajax请求',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.isRequestFromSelf',
    type: MatchedType.field,
    description: '请求是否来自SSR',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.originalUrl',
    type: MatchedType.field,
    description: '请求URL, 含Query参数',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.params',
    type: MatchedType.field,
    description: '请求params',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.path',
    type: MatchedType.field,
    description: '请求的URL, 不含Query参数',
    location: Location.local,
  },
  { name: 'fields.requestContext.query', type: MatchedType.field, description: 'Query参数', location: Location.local },
  {
    name: 'fields.requestContext.referer',
    type: MatchedType.field,
    description: '引用页面Url',
    location: Location.local,
  },

  {
    name: 'fields.requestContext.requestFromAppName',
    type: MatchedType.field,
    description: '请求来自哪个应用?',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.requestFromClusterName',
    type: MatchedType.field,
    description: '请求来自哪个集群?',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.requestFromNodeName',
    type: MatchedType.field,
    description: '请求来自哪个节点?',
    location: Location.local,
  },

  {
    name: 'fields.requestContext.requestFromHeadAppName',
    type: MatchedType.field,
    description: '请求来自最前面哪个应用?',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.requestFromHeadClusterName',
    type: MatchedType.field,
    description: '请求来自最前面哪个集群?',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.requestFromHeadNodeName',
    type: MatchedType.field,
    description: '请求来自最前面哪个节点?',
    location: Location.local,
  },

  {
    name: 'fields.requestContext.requestId',
    type: MatchedType.field,
    description: '请求唯一ID',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.strategies.disableCache',
    type: MatchedType.field,
    description: '是否禁用缓存标识',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.strategies.isInBlacklist',
    type: MatchedType.field,
    description: '是否在黑名单里面',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.strategies.isInWhitelist',
    type: MatchedType.field,
    description: '是否在白名单里面',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.strategies.isSpider',
    type: MatchedType.field,
    description: '是否为白蜘蛛',
    location: Location.local,
  },
  {
    name: 'fields.requestContext.userAgent',
    type: MatchedType.field,
    description: '用户浏览器代理字符串',
    location: Location.local,
  },
  { name: 'fields.requestContext.userId', type: MatchedType.field, description: '用户ID', location: Location.local },

  // apiRequest相关
  {
    name: 'fields.requestInfo.apiCost',
    type: MatchedType.field,
    description: '目标接口业务逻辑执行耗时',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.body',
    type: MatchedType.field,
    description: 'api请求body参数',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.custom',
    type: MatchedType.field,
    description: 'api请求axios自定义参数',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.elapsed',
    type: MatchedType.field,
    description: '目标接口请求总耗时',
    location: Location.local,
  },
  { name: 'fields.requestInfo.end', type: MatchedType.field, description: 'api请求结束时间', location: Location.local },
  {
    name: 'fields.requestInfo.headers',
    type: MatchedType.field,
    description: 'api请求headers',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.httpStatus',
    type: MatchedType.field,
    description: 'api请求返回的http状态码',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.message',
    type: MatchedType.field,
    description: 'api请求发生错误时，错误信息',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.output',
    type: MatchedType.field,
    description: 'api请求发生错误时，服务器返回的body',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.query',
    type: MatchedType.field,
    description: 'api请求query参数',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.stage',
    type: MatchedType.field,
    description: 'api请求日志产生阶段',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.start',
    type: MatchedType.field,
    description: 'api请求开始时间',
    location: Location.local,
  },
  {
    name: 'fields.requestInfo.transferCost',
    type: MatchedType.field,
    description: 'api请求网络传输耗时',
    location: Location.local,
  },
  { name: 'fields.requestInfo.url', type: MatchedType.field, description: 'api请求地址', location: Location.local },

  // 序列化错误像概念
  {
    name: 'fields.serializerError.content',
    type: MatchedType.field,
    description: '序列化错误内容',
    location: Location.local,
  },
  {
    name: 'fields.serializerError.stage',
    type: MatchedType.field,
    description: '序列化错误发生阶段',
    location: Location.local,
  },
  {
    name: 'fields.serializerError.type',
    type: MatchedType.field,
    description: '序列化器类别',
    location: Location.local,
  },
  {
    name: 'fields.slowQueryMetric.elapsed',
    type: MatchedType.field,
    description: '慢查询耗时',
    location: Location.local,
  },

  // 慢查询指标数据相关
  {
    name: 'fields.slowQueryMetric.execute',
    type: MatchedType.field,
    description: '慢查询目标系统返回的实际执行耗时',
    location: Location.local,
  },
  {
    name: 'fields.slowQueryMetric.threshold',
    type: MatchedType.field,
    description: '慢查询判定阀值',
    location: Location.local,
  },

  // H5客户端错误相关
  {
    name: 'fields.uncaughtClientException.extra.info',
    type: MatchedType.field,
    description: 'H5前端错误发生生命周期',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.nodeName',
    type: MatchedType.field,
    description: 'H5前端错误HTML节点名称',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.originalUrl',
    type: MatchedType.field,
    description: 'H5前端错误发生的URL',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.outerHTML',
    type: MatchedType.field,
    description: 'H5前端错误节点HTML',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.path',
    type: MatchedType.field,
    description: 'H5前端错误路由PATH',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.src',
    type: MatchedType.field,
    description: 'H5前端错误请求资源路劲',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.targetUrl',
    type: MatchedType.field,
    description: 'H5前端错误目标页面URL',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.extra.type',
    type: MatchedType.field,
    description: 'H5前端错误类别',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.name',
    type: MatchedType.field,
    description: 'H5前端错误名称',
    location: Location.local,
  },
  {
    name: 'fields.uncaughtClientException.name',
    type: MatchedType.field,
    description: 'H5前端错误名称',
    location: Location.local,
  },

  // 用户信息相关
  { name: 'fields.user.userId', type: MatchedType.field, description: '用户注册-用户ID', location: Location.local },
  {
    name: 'fields.user.loginType',
    type: MatchedType.field,
    description: '用户注册-登陆方式',
    location: Location.local,
  },
  {
    name: 'fields.user.appFrom',
    type: MatchedType.field,
    description: '用户注册-渠道/来源/活动',
    location: Location.local,
  },
  {
    name: 'fields.user.appFromType',
    type: MatchedType.field,
    description: '用户注册-来源类型（activity,channel）',
    location: Location.local,
  },
  {
    name: 'fields.user.umengActivityId',
    type: MatchedType.field,
    description: '用户注册-umeng活动ID',
    location: Location.local,
  },
  {
    name: 'fields.user.phoneSegment ',
    type: MatchedType.field,
    description: '用户注册-手机号网段',
    location: Location.local,
  },

  // 订单相关
  { name: 'fields.order.orderNo', type: MatchedType.field, description: '订单创建-订单号码', location: Location.local },
  {
    name: 'fields.order.goodsCat',
    type: MatchedType.field,
    description: '订单创建-商品类型',
    location: Location.local,
  },
  { name: 'fields.order.goodsId', type: MatchedType.field, description: '订单创建-商品ID', location: Location.local },
  {
    name: 'fields.order.goodsName',
    type: MatchedType.field,
    description: '订单创建-商品名称',
    location: Location.local,
  },
  { name: 'fields.order.userId', type: MatchedType.field, description: '订单创建-用户ID', location: Location.local },
  {
    name: 'fields.order.paySourceType',
    type: MatchedType.field,
    description: '订单创建-订单来源',
    location: Location.local,
  },
  {
    name: 'fields.order.paySourceTypeRemark',
    type: MatchedType.field,
    description: '订单创建-订单来源名称',
    location: Location.local,
  },
  {
    name: 'fields.order.payMethod',
    type: MatchedType.field,
    description: '订单创建-支付方式',
    location: Location.local,
  },
  { name: 'fields.order.price', type: MatchedType.field, description: '订单创建-订单金额', location: Location.local },
  {
    name: 'fields.order.realPrice',
    type: MatchedType.field,
    description: '订单创建-需要支付金额',
    location: Location.local,
  },
  {
    name: 'fields.order.useCoupon',
    type: MatchedType.field,
    description: '订单创建-是否使用优惠券',
    location: Location.local,
  },
  {
    name: 'fields.order.couponId',
    type: MatchedType.field,
    description: '订单创建-优惠券ID',
    location: Location.local,
  },
  {
    name: 'fields.order.orderCreatedTime',
    type: MatchedType.field,
    description: '订单创建-订单创建时间',
    location: Location.local,
  },
  {
    name: 'fields.order.hasPaidOrder',
    type: MatchedType.field,
    description: '订单创建-该用户之前是否消费过',
    location: Location.local,
  },
  {
    name: 'fields.order.hasPaidOrderSameCat',
    type: MatchedType.field,
    description: '订单创建-该用户之前是否消费过同类型商品',
    location: Location.local,
  },
  {
    name: 'fields.order.registerOrderElapsed',
    type: MatchedType.field,
    description: '订单创建-下单日期距离注册日期的相差天数',
    location: Location.local,
  },
  {
    name: 'fields.order.registerOrderElapsedSec',
    type: MatchedType.field,
    description: '订单创建-首日注册首日下单相隔时间(秒数)',
    location: Location.local,
  },
  {
    name: 'fields.order.discountType',
    type: MatchedType.field,
    description: '订单创建-抵扣方式',
    location: Location.local,
  },
  {
    name: 'fields.order.discountAmount',
    type: MatchedType.field,
    description: '订单创建-抵扣金额',
    location: Location.local,
  },
  {
    name: 'fields.order.appFrom',
    type: MatchedType.field,
    description: '订单创建-渠道/来源/活动',
    location: Location.local,
  },
  {
    name: 'fields.order.appFromType',
    type: MatchedType.field,
    description: '订单创建-来源类型（activity,channel）',
    location: Location.local,
  },
  {
    name: 'fields.order.umengActivityId',
    type: MatchedType.field,
    description: '订单创建-umeng活动ID',
    location: Location.local,
  },
  {
    name: 'fields.order.clientIp',
    type: MatchedType.field,
    description: '订单创建-客户端Ip',
    location: Location.local,
  },

  // 支付相关
  {
    name: 'fields.payment.orderNo',
    type: MatchedType.field,
    description: '支付回调-订单号码',
    location: Location.local,
  },
  {
    name: 'fields.payment.goodsCat',
    type: MatchedType.field,
    description: '支付回调-商品类型',
    location: Location.local,
  },
  { name: 'fields.payment.goodsId', type: MatchedType.field, description: '支付回调-商品ID', location: Location.local },
  {
    name: 'fields.payment.goodsName',
    type: MatchedType.field,
    description: '支付回调-商品名称',
    location: Location.local,
  },
  { name: 'fields.payment.userId', type: MatchedType.field, description: '支付回调-用户ID', location: Location.local },
  {
    name: 'fields.payment.paySourceType',
    type: MatchedType.field,
    description: '支付回调-订单来源',
    location: Location.local,
  },
  {
    name: 'fields.payment.paySourceTypeRemark',
    type: MatchedType.field,
    description: '支付回调-订单来源名称',
    location: Location.local,
  },
  {
    name: 'fields.payment.payMethod',
    type: MatchedType.field,
    description: '支付回调-支付方式',
    location: Location.local,
  },
  { name: 'fields.payment.price', type: MatchedType.field, description: '支付回调-订单金额', location: Location.local },
  {
    name: 'fields.payment.realPrice',
    type: MatchedType.field,
    description: '支付回调-需要支付金额',
    location: Location.local,
  },
  {
    name: 'fields.payment.useCoupon',
    type: MatchedType.field,
    description: '支付回调-是否使用优惠券',
    location: Location.local,
  },
  {
    name: 'fields.payment.couponId',
    type: MatchedType.field,
    description: '支付回调-优惠券ID',
    location: Location.local,
  },
  {
    name: 'fields.payment.orderCreatedTime',
    type: MatchedType.field,
    description: '支付回调-订单创建时间',
    location: Location.local,
  },
  {
    name: 'fields.payment.paymentTime',
    type: MatchedType.field,
    description: '支付回调-支付时间',
    location: Location.local,
  },
  {
    name: 'fields.payment.paymentElapsed',
    type: MatchedType.field,
    description: '支付回调-支付犹豫期（近似）',
    location: Location.local,
  },
  {
    name: 'fields.payment.hasPaidOrder',
    type: MatchedType.field,
    description: '支付回调-该用户之前是否消费过',
    location: Location.local,
  },
  {
    name: 'fields.payment.hasPaidOrderSameCat',
    type: MatchedType.field,
    description: '支付回调-该用户之前是否消费过同类型商品',
    location: Location.local,
  },
  {
    name: 'fields.payment.registerOrderElapsed',
    type: MatchedType.field,
    description: '支付回调-下单日期距离注册日期的相差天数',
    location: Location.local,
  },
  {
    name: 'fields.payment.registerOrderElapsedSec',
    type: MatchedType.field,
    description: '支付回调-首日注册首日下单相隔时间(秒数)',
    location: Location.local,
  },
  {
    name: 'fields.payment.discountType',
    type: MatchedType.field,
    description: '支付回调-抵扣方式',
    location: Location.local,
  },
  {
    name: 'fields.payment.discountAmount',
    type: MatchedType.field,
    description: '支付回调-抵扣金额',
    location: Location.local,
  },
  {
    name: 'fields.payment.appFrom',
    type: MatchedType.field,
    description: '支付回调-渠道/来源/活动',
    location: Location.local,
  },
  {
    name: 'fields.payment.appFromType',
    type: MatchedType.field,
    description: '支付回调-来源类型（activity,channel）',
    location: Location.local,
  },
  {
    name: 'fields.payment.umengActivityId',
    type: MatchedType.field,
    description: '支付回调-umeng活动ID',
    location: Location.local,
  },
  {
    name: 'fields.payment.clientIp',
    type: MatchedType.field,
    description: '支付回调-客户端Ip',
    location: Location.local,
  },

  // 设备信息相关
  { name: 'fields.deviceInfo.brand', type: MatchedType.field, description: '手机品牌', location: Location.local },
  { name: 'fields.deviceInfo.model', type: MatchedType.field, description: '手机型号', location: Location.local },
  {
    name: 'fields.deviceInfo.carrie',
    type: MatchedType.field,
    description: '运营商（中国移动等）',
    location: Location.local,
  },
  { name: 'fields.deviceInfo.channel', type: MatchedType.field, description: '渠道包', location: Location.local },

  // 地理位置相关
  {
    name: 'fields.geo.location',
    type: MatchedType.field,
    description: '地理位置-百度经纬度(bd09ll坐标系)',
    location: Location.local,
  },
  { name: 'fields.geo.province', type: MatchedType.field, description: '地理位置-省', location: Location.local },
  { name: 'fields.geo.city', type: MatchedType.field, description: '地理位置-市', location: Location.local },
  { name: 'fields.geo.district', type: MatchedType.field, description: '地理位置-区', location: Location.local },
  { name: 'fields.geo.town', type: MatchedType.field, description: '地理位置-镇', location: Location.local },
  { name: 'fields.geo.street', type: MatchedType.field, description: '地理位置-街道', location: Location.local },
  { name: 'fields.geo.address', type: MatchedType.field, description: '地理位置-详细地址', location: Location.local },
  {
    name: 'fields.geo.from',
    type: MatchedType.field,
    description: '地理位置-地址获取方式，geo or ip',
    location: Location.local,
  },
];

// -----------------------------------------------------------------------------------------

const fields: Record<string, string> = {};

_.forEach(fieldsFromBackendDataSourcePlugin, (o) => {
  fields[o.name] = o.description;
});

const getFileDescription = (fileName: string): string => {
  return fields[fileName] || '';
};

export default {
  getFileDescription,
};

export { getFileDescription };
