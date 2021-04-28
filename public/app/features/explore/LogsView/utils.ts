/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import _ from 'lodash';
import { parse } from 'flatted';

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

export default {
  flattenObject,
  stringToJson,
  trimSemicolon,
};
