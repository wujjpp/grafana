/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

const fields: Record<string, string> = {
  appName: '应用名称',
  category: '日志归类',
  env: '运行环境',
  host: '',
  level: '日志等级',
  time: '日志时间（unix time in ms）',
  timsString: '日志时间',
  __time__: '日志入库时间（unix time in seconds）',
  version: '应用版本',
  'fields.elasticSearchError.actionName': '操作名称',
  'fields.elasticSearchError.host': 'ES主机',
  'fields.elasticSearchError.params': 'ES查询参数',
  'fields.elasticSearchSlow.action': '操作名称',
  'fields.elasticSearchSlow.end': '查询完成时间',
  'fields.elasticSearchSlow.host': 'ES主机',
  'fields.elasticSearchSlow.queryInfo': 'ES查询参数',
  'fields.elasticSearchSlow.start': '查询开始时间',
  'fields.error.code': '错误代码',
  'fields.error.errno': '错误码',
  'fields.error.message': '错误信息',
  'fields.error.stack': '错误stack trace',
  'fields.eventType': '事件名称',
  'fields.http.contentLength': 'http body长度',
  'fields.http.httpStatus': 'http状态码',
  'fields.http.responseTime': 'http耗时',
  'fields.mongooseError.connectionName': 'mongoose连接名称',
  'fields.mongooseSlow.action': 'mogoose操作名',
  'fields.mongooseSlow.collection': 'mongodb collection名',
  'fields.mongooseSlow.connection.host': 'mongodb 主机名',
  'fields.mongooseSlow.connection.name': '',
  'fields.mongooseSlow.connection.port': '',
  'fields.mongooseSlow.connection.user': 'mongoose用户名',
  'fields.mongooseSlow.end': 'mongoose查询结束时间',
  'fields.mongooseSlow.query': 'mongoose查询参数',
  'fields.mongooseSlow.start': 'mongoose查询开始时间',
  'fields.mysqlError.config.database': 'mysql数据库名',
  'fields.mysqlError.config.host': 'mysql主机名',
  'fields.mysqlError.config.user': 'mysql用户名',
  'fields.mysqlError.sql': 'mysql错误查询语句',
  'fields.mysqlSlow.config.database': 'mysql数据库名',
  'fields.mysqlSlow.config.host': 'mysql数据库主机名',
  'fields.mysqlSlow.config.port': 'mysql数据库端口',
  'fields.mysqlSlow.config.user': 'mysql数据库用户名',
  'fields.mysqlSlow.sql': 'mysql慢查询sql语句',
  'fields.redisRetry.config.host': 'redis主机地址',
  'fields.redisRetry.options': 'redis重连参数',
  'fields.redisRetry.stage': 'redis重试阶段',
  'fields.requestContext.appVersion': '当前请求来自?（包含应用名称及版本）',
  'fields.requestContext.accessToken': 'app端请求的accessToken',
  'fields.requestContext.body': '请求body参数',
  'fields.requestContext.clientIp': '远端IP',
  'fields.requestContext.clientRealIp': '客户端真实IP',
  'fields.requestContext.currentAppName': '当前应用名称',
  'fields.requestContext.currentClusterName': '当前应用所在集群名称（运维注入）',
  'fields.requestContext.currentContainerName': '当前应用所在容器名称（容器主机名）',
  'fields.requestContext.currentNodeName': '当前应用所在节点名称（运维注入）',
  'fields.requestContext.deviceId': '设备ID，对于Web类应用该栏位为SessionID',
  'fields.requestContext.deviceType': '设备类型',
  'fields.requestContext.functionName': '功能名称',
  'fields.requestContext.headers': '当前请求headers',
  'fields.requestContext.hop': '请求链层级',
  'fields.requestContext.isSvip': '当前用户是否为SVIP',
  'fields.requestContext.isVip': '当前用户是否为VIP',
  'fields.requestContext.isXhr': '是否为ajax请求',
  'fields.requestContext.originalUrl': '请求URL, 含Query参数',
  'fields.requestContext.originalUrl2': '完整的请求URL，包含请求参数，一般用于直接复制',
  'fields.requestContext.params': '请求params',
  'fields.requestContext.path': '请求的URL, 不含Query参数',
  'fields.requestContext.query': 'Query参数',
  'fields.requestContext.referer': '引用页面Url',
  'fields.requestContext.requestFromAppName': '请求来自哪个应用?',
  'fields.requestContext.requestFromClusterName': '请求来自哪个集群?',
  'fields.requestContext.requestFromNodeName': '请求来自哪个节点?',
  'fields.requestContext.requestFromHeadAppName': '请求来自最前面哪个应用?',
  'fields.requestContext.requestFromHeadClusterName': '请求来自最前面哪个集群?',
  'fields.requestContext.requestFromHeadNodeName': '请求来自最前面哪个节点?',
  'fields.requestContext.requestId': '请求唯一ID',
  'fields.requestContext.strategies.disableCache': '是否禁用缓存标识',
  'fields.requestContext.strategies.isInBlacklist': '是否在黑名单里面',
  'fields.requestContext.strategies.isInWhitelist': '是否在白名单里面',
  'fields.requestContext.strategies.isSpider': '是否为白蜘蛛',
  'fields.requestContext.userAgent': '用户浏览器代理字符串',
  'fields.requestContext.userId': '用户ID',
  'fields.requestInfo.apiCost': '目标接口业务逻辑执行耗时',
  'fields.requestInfo.body': 'api请求body参数',
  'fields.requestInfo.custom': 'api请求axios自定义参数',
  'fields.requestInfo.elapsed': '目标接口请求总耗时',
  'fields.requestInfo.end': 'api请求结束时间',
  'fields.requestInfo.headers': 'api请求headers',
  'fields.requestInfo.httpStatus': 'api请求返回的http状态码',
  'fields.requestInfo.message': 'api请求发生错误时，错误信息',
  'fields.requestInfo.output': 'api请求发生错误时，服务器返回的body',
  'fields.requestInfo.query': 'api请求query参数',
  'fields.requestInfo.stage': 'api请求日志产生阶段',
  'fields.requestInfo.start': 'api请求开始时间',
  'fields.requestInfo.transferCost': 'api请求网络传输耗时',
  'fields.requestInfo.url': 'api请求地址',
  'fields.requestInfo.urlFull': 'api请求地址，包含请求参数，一般用于复制',
  'fields.serializerError.content': '序列化错误内容',
  'fields.serializerError.stage': '序列化错误发生阶段',
  'fields.serializerError.type': '序列化器类别',
  'fields.slowQueryMetric.elapsed': '慢查询耗时',
  'fields.slowQueryMetric.threshold': '慢查询判定阀值',
  'fields.uncaughtClientException.extra.info': 'H5前端错误发生生命周期',
  'fields.uncaughtClientException.extra.nodeName': 'H5前端错误HTML节点名称',
  'fields.uncaughtClientException.extra.originalUrl': 'H5前端错误发生的URL',
  'fields.uncaughtClientException.extra.outerHTML': 'H5前端错误节点HTML',
  'fields.uncaughtClientException.extra.path': 'H5前端错误路由PATH',
  'fields.uncaughtClientException.extra.src': 'H5前端错误请求资源路劲',
  'fields.uncaughtClientException.extra.targetUrl': 'H5前端错误目标页面URL',
  'fields.uncaughtClientException.extra.type': 'H5前端错误类别',
  'fields.uncaughtClientException.name': 'H5前端错误名称',
};

const getFileDescription = (fileName: string): string => {
  return fields[fileName] || '';
};

export default {
  getFileDescription,
};

export { getFileDescription };
