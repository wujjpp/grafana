/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import { keys, isPlainObject, trimStart, trimEnd, isUndefined, isNull, isArray } from 'lodash';
import { parse } from 'flatted';

const _ = { keys, isPlainObject, trimStart, trimEnd, isUndefined, isNull, isArray };

const flattenObject = (source: Record<string, any>, target: any = {}, fullPath = ''): Record<string, any> => {
  const keys = _.keys(source);
  for (const key of keys) {
    const value = source[key];
    const fullPathOfKey = (fullPath ? `${fullPath}.` : '') + key;
    if (_.isArray(value)) {
      try {
        target[fullPathOfKey] = ((global as any).nativeJSON ?? JSON).stringify(value);
      } catch {} // 这里吞掉错误，防止进入死循环
    } else if (_.isPlainObject(value)) {
      flattenObject(value, target, fullPathOfKey);
    } else {
      target[fullPathOfKey] = value;
    }
  }
  return target;
};

const stringToJson = (str: string): any => {
  try {
    return parse(str);
  } catch {
    try {
      return JSON.parse(str);
    } catch {}
  }
  throw new Error('Cannot convert string to json');
};

const trimSemicolon = (val: string): string => {
  val = _.trimStart(val, '"');
  val = _.trimStart(val, "'");
  val = _.trimEnd(val, '"');
  val = _.trimEnd(val, "'");

  return val;
};

// 时间轴向前小猴偏移量10分钟，保证有数据是全的
const OFFSET = 10 * 60 * 1000;

const getFieldToExploreLink = (
  fieldName: string,
  fieldValue: any,
  dataSourceInstanceName: string,
  from: number,
  to: number,
  invert = false
): string => {
  if (!_.isUndefined(fieldValue) && !_.isNull(fieldValue) && fieldValue !== '') {
    const params = [
      `${from - OFFSET}`,
      `${to + OFFSET}`,
      dataSourceInstanceName,
      { queryText: invert ? `* and not ${fieldName}:*` : `* and ${fieldName}:"${fieldValue}"` },
    ];
    const target = `/explore?orgId=1&left=${encodeURIComponent(JSON.stringify(params))}`;

    return `<a href=${target} target="_blank" title="点击查看【${fieldName}=${fieldValue}】的日志" class="link-to-explore">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      class="link-to-explore-svg"
    >
      <path d="M18,10.82a1,1,0,0,0-1,1V19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V8A1,1,0,0,1,5,7h7.18a1,1,0,0,0,0-2H5A3,3,0,0,0,2,8V19a3,3,0,0,0,3,3H16a3,3,0,0,0,3-3V11.82A1,1,0,0,0,18,10.82Zm3.92-8.2a1,1,0,0,0-.54-.54A1,1,0,0,0,21,2H15a1,1,0,0,0,0,2h3.59L8.29,14.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L20,5.41V9a1,1,0,0,0,2,0V3A1,1,0,0,0,21.92,2.62Z">
      </path>
    </svg>
  </a>`;
  }
  return '';
};

// URL中可能包含&timestamp字串, 这会导致被解析成表情符号x, 这边列出了白名单栏位，不能使用HTML方式显示
const SHOULD_SHOW_ORIGIN_CONTENT_FIELDS = [
  'fields.requestContext.originalUrl',
  'fields.requestContext.path',
  'fields.requestContext.referer',
  'fields.requestInfo.url',
  'fields.requestInfo.urlFull',
];

// 哪些栏位需要添加explore链接
const SHOULD_ADD_LINK_TO_EXPLORE = [
  'category',
  'level',
  'logId',
  'fields.eventType',
  'fields.requestContext.requestId',
  'fields.requestContext.deviceId',
  'fields.requestContext.userId',
  'fields.requestContext.clientIp',
  'fields.requestContext.clientRealIp',
  'fields.error.code',
  'fields.error.errno',
  'fields.error.message',
  'fields.error.name',
  'fields.requestContext.path',
  'fields.requestContext.strategies.isInBlacklist',
  'fields.requestContext.deviceType',
  'fields.requestContext.userAgent',
  'fields.http.httpStatus',
  'fields.requestContext.eagleeyeTraceId',
  'fields.requestContext.requestFromAppName',
  'fields.requestContext.requestFromHeadAppName',
  'fields.requestContext.requestFromClusterName',
  'fields.requestContext.requestFromHeadClusterName',
];

export default {
  flattenObject,
  stringToJson,
  trimSemicolon,
  getFieldToExploreLink,
  SHOULD_SHOW_ORIGIN_CONTENT_FIELDS,
  SHOULD_ADD_LINK_TO_EXPLORE,
};
