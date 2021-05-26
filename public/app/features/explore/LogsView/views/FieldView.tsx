/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import _ from 'lodash';
import JsonView from './JsonView';
import SqlView from './SqlView';
import utils from '../utils';

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

    toggleContainer: css`
      text-align: center;
      cursor: pointer;
      color: rgb(179, 179, 179);

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
  };
})();

interface Props {
  isInJsonMode: boolean;
  isInSqlMode: boolean;
  fieldName: string;
  value: any;
  valueFilters: string[];
  onChangeValueSearchFilter: (value: string) => void;
}

interface State {
  expanded: boolean;
}

// 获取栏位样式
const getFieldClassName = (key: string) => {
  if (key === 'fields.error.message') {
    return styles.statusError;
  }
  return '';
};

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    expanded: false,
  };

  container: HTMLElement | null;
  toggleBtn: HTMLElement | null;

  // 格式化内容，遇到"回车"换成<br />
  formatField(v: any) {
    // 处理换行
    if (_.isString(v) && v.indexOf('\n') !== 0) {
      v = v.replace(/\n/gi, '<br />');
    }

    if (!_.isString(v) && v !== undefined) {
      v = v.toString();
    }

    // 处理高亮
    if (this.props.valueFilters.length > 0) {
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

  toggle() {
    this.setState({ ...this.state, expanded: !this.state.expanded });

    if (this.container) {
      if (this.state.expanded) {
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
            <div
              ref={(container) => {
                this.container = container;
              }}
              className={getFieldClassName(fieldName)}
              dangerouslySetInnerHTML={{ __html: this.formatField(value) }}
            ></div>
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
          </div>
        )}
      </td>
    );
  }
}
