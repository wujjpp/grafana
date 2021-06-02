/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory } from '@grafana/ui';
import { AbsoluteTimeRange } from '@grafana/data';
import { css } from 'emotion';
import _ from 'lodash';
import JsonView from './JsonView';
import SqlView from './SqlView';
import utils from '../utils';
import copy from 'copy-to-clipboard';

const moment = require('moment');

require('./global.css');

const styles = stylesFactory(() => {
  return {
    td: css`
      word-wrap: break-word;
      border: 0 !important;
      line-height: 1.5;
      position: relative;
    `,

    expandedContainer: css`
      position: relative;
    `,

    contentContainer: css`
      max-height: 360px;
      overflow: hidden;
    `,

    fieldContextContainer: css`
      padding-right: 20px;
    `,

    toolbarContainer: css`
      position: absolute;
      right: 0;
      top: 0;
    `,

    toolbarItem: css`
      position: relative;
      display: inline-block;
      cursor: pointer;
      color: rgb(179, 179, 179);
      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    toolbarItemActive: css`
      color: rgb(51, 162, 229) !important;
    `,

    toggleContainer: css`
      text-align: center;
      cursor: pointer;
      color: rgb(179, 179, 179);
      background-color: #202226;
      padding-right: 20px;

      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    flow: css`
      // position: absolute;
      // left: 0;
      // right: 0;
      // bottom: 0;
    `,

    statusError: css`
      color: red;
    `,

    colorTrace: css`
      color: rgb(110, 208, 224);
      font-weight: 700;
    `,

    colorDebug: css`
      color: blue;
      font-weight: 700;
    `,

    colorInfo: css`
      color: green;
      font-weight: 700;
    `,

    colorWarn: css`
      color: yellow;
      font-weight: 700;
    `,

    colorError: css`
      color: red;
      font-weight: 700;
    `,

    colorFatal: css`
      color: purple;
      font-weight: 700;
    `,

    colorBlue: css`
      color: rgb(51, 162, 229);
    `,

    linkA: css`
      display: inline-block;
      vertical-align: middle;
    `,

    linkSvg: css`
      fill: rgb(179, 179, 179);
      :hover {
        fill: rgb(255, 255, 255);
      }
    `,
  };
})();

interface Props {
  isInJsonMode: boolean;
  isInSqlMode: boolean;
  fieldName: string;
  value: any;
  valueFilters: string[];
  onChangeValueSearchFilter: (value: string) => void;
  dataSourceInstanceName: string;
  absoluteTimeRange: AbsoluteTimeRange;
}

interface State {
  expanded: boolean;
}

// 获取栏位样式
const getFieldClassName = (key: string, value: any): string => {
  let className = '';
  if (key === 'fields.error.message') {
    className = styles.statusError;
  } else if (key === 'level') {
    switch (value) {
      case 'TRACE':
        className = styles.colorTrace;
        break;
      case 'DEBUG':
        className = styles.colorDebug;
        break;
      case 'INFO':
        className = styles.colorInfo;
        break;
      case 'WARN':
        className = styles.colorWarn;
        break;
      case 'ERROR':
        className = styles.colorError;
        break;
      case 'FATAL':
        className = styles.colorFatal;
        break;
    }
  } else if (
    key === 'appName' ||
    key === 'category' ||
    key === 'fields.eventType' ||
    key === 'fields.requestContext.originalUrl2' ||
    key === 'fields.requestInfo.urlFull'
  ) {
    className = styles.colorBlue;
  }

  return className;
};

// URL中可能包含&timestamp字串, 这会导致被解析成表情符号x, 这边列出了白名单栏位，不能使用HTML方式显示
const SHOULD_SHOW_ORIGIN_CONTENT_FIELDS = [
  'fields.requestContext.originalUrl',
  'fields.requestContext.originalUrl2',
  'fields.requestContext.path',
  'fields.requestContext.referer',
  'fields.requestInfo.url',
  'fields.requestInfo.urlFull',
];

// 哪些栏位需要添加explore链接
const SHOUL_ADD_LINK_TO_EXPLORE = [
  'category',
  'level',
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
];

// 时间轴向前小猴偏移量10分钟，保证有数据是全的
const OFFSET = 10 * 60 * 1000;

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    expanded: false,
  };

  container: HTMLElement | null;
  toggleBtn: HTMLElement | null;

  getFileldLink(fieldName: string, fieldValue: string): string {
    if (!_.isUndefined(fieldValue) && !_.isNull(fieldValue) && fieldValue !== '') {
      const { dataSourceInstanceName, absoluteTimeRange } = this.props;

      const params = [
        `${absoluteTimeRange.from - OFFSET}`,
        `${absoluteTimeRange.to + OFFSET}`,
        dataSourceInstanceName,
        { queryText: `* and ${fieldName}:"${fieldValue}"` },
      ];
      const target = `/explore?orgId=1&left=${encodeURIComponent(JSON.stringify(params))}`;

      return `<a href=${target} target="_blank" title="点击查看【${fieldName}=${fieldValue}】的日志" class="${styles.linkA}">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        class="${styles.linkSvg}"
      >
        <path d="M18,10.82a1,1,0,0,0-1,1V19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V8A1,1,0,0,1,5,7h7.18a1,1,0,0,0,0-2H5A3,3,0,0,0,2,8V19a3,3,0,0,0,3,3H16a3,3,0,0,0,3-3V11.82A1,1,0,0,0,18,10.82Zm3.92-8.2a1,1,0,0,0-.54-.54A1,1,0,0,0,21,2H15a1,1,0,0,0,0,2h3.59L8.29,14.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L20,5.41V9a1,1,0,0,0,2,0V3A1,1,0,0,0,21.92,2.62Z">
        </path>
      </svg>
    </a>`;
    }
    return '';
  }

  // 格式化内容，遇到"回车"换成<br />
  formatField(fieldName: string, v: any) {
    if (_.includes(SHOUL_ADD_LINK_TO_EXPLORE, fieldName)) {
      return `${v}&nbsp;&nbsp;${this.getFileldLink(fieldName, v)}`;
    }

    if (fieldName === 'time' && _.isString(v) && v.length === 13) {
      return moment(+v).format('YYYY-MM-DD HH:mm:ss.SSS') + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${v})`;
    }

    // 处理换行
    if (_.isString(v) && v.indexOf('\n') !== 0) {
      v = v.replace(/\n/gi, '<br />');
    }

    if (!_.isString(v) && v !== undefined && v !== null) {
      v = v.toString();
    }

    // 处理高亮
    if (this.props.valueFilters.length > 0 && v) {
      const matches = _.map(this.props.valueFilters, (key) => {
        return {
          regexp: new RegExp(`${key}`, 'ig'),
          key: key,
        };
      });

      _.forEach(matches, (match) => {
        v = v.replace(match.regexp, `<em>${match.key}</em>`);
      });
    }

    return v;
  }

  changeSearchValueFilter(value: any, event: any) {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  componentDidMount() {
    if (this.container) {
      const height = $(this.container).height();
      if (height !== undefined && height > 360) {
        $(this.container).addClass(styles.contentContainer);
        if (this.toggleBtn) {
          $(this.toggleBtn).addClass(styles.flow).show();
        }
      } else {
        if (this.toggleBtn) {
          $(this.toggleBtn).hide();
        }
      }
    }
  }

  componentDidUpdate() {
    const { isInJsonMode, isInSqlMode } = this.props;

    if (!isInJsonMode && !isInSqlMode) {
      if (this.container) {
        if (this.container) {
          if (!this.state.expanded) {
            $(this.container).addClass(styles.contentContainer);
            if (this.toggleBtn) {
              $(this.toggleBtn).addClass(styles.flow);
            }
          } else {
            $(this.container).removeClass(styles.contentContainer);
            if (this.toggleBtn) {
              $(this.toggleBtn).removeClass(styles.flow);
            }
          }
        }
      }
    }
  }

  toggle() {
    this.setState({ ...this.state, expanded: !this.state.expanded });
  }

  copyValue(value: string, event: any): void {
    copy(value);

    $(event.target.parentElement).addClass(styles.toolbarItemActive);

    setTimeout(() => {
      $(event.target.parentElement).removeClass(styles.toolbarItemActive);
    }, 800);
  }

  render() {
    const { value, valueFilters, isInJsonMode, isInSqlMode, fieldName } = this.props;

    return (
      <td className={styles.td}>
        {isInJsonMode ? (
          <div>
            <JsonView
              entity={utils.stringToJson(value)}
              onValueClick={this.changeSearchValueFilter.bind(this)}
              valueFilters={valueFilters}
            ></JsonView>
          </div>
        ) : isInSqlMode ? (
          <div>
            <SqlView sql={value}></SqlView>
          </div>
        ) : (
          <div className={styles.expandedContainer}>
            {/* URL类的栏位不需要以HTML方式展示 */}
            {_.includes(SHOULD_SHOW_ORIGIN_CONTENT_FIELDS, fieldName) ? (
              <div
                ref={(container) => {
                  this.container = container;
                }}
                className={`${getFieldClassName(fieldName, value)} ${styles.fieldContextContainer}`}
              >
                <span>{value}</span>
                {_.includes(SHOUL_ADD_LINK_TO_EXPLORE, fieldName) && (
                  <>
                    &nbsp;&nbsp;<span dangerouslySetInnerHTML={{ __html: this.getFileldLink(fieldName, value) }}></span>
                  </>
                )}
              </div>
            ) : (
              <div
                ref={(container) => {
                  this.container = container;
                }}
                className={`${getFieldClassName(fieldName, value)} ${styles.fieldContextContainer}`}
                dangerouslySetInnerHTML={{ __html: this.formatField(fieldName, value) }}
              ></div>
            )}

            {!_.isNull(value) && !_.isUndefined(value) && value !== '' && (
              <>
                <div className={styles.toolbarContainer}>
                  <div className={styles.toolbarItem}>
                    <Icon name="copy" title="复制内容" onClick={this.copyValue.bind(this, value)}></Icon>
                  </div>
                </div>

                <div
                  ref={(btn) => {
                    this.toggleBtn = btn;
                  }}
                  className={styles.toggleContainer}
                  onClick={this.toggle.bind(this)}
                >
                  {this.state.expanded ? (
                    <>
                      点击收起 <Icon name="angle-up"></Icon>
                    </>
                  ) : (
                    <>
                      点击展开 <Icon name="angle-down"></Icon>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </td>
    );
  }
}
