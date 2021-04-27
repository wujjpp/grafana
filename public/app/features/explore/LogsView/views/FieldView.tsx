/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import _ from 'lodash';
import HighlightView, { Languages } from './HighlightView';
import utils from '../utils';

require('./global.css');

const styles = stylesFactory(() => {
  return {
    td: css`
      word-wrap: break-word;
      padding: 6px;
      border: 0 !important;
      line-height: 1.5;
      position: relative;
    `,
    toolbar: css`
      position: absolute;
      right: 6px;
      bottom: 6px;
      cursor: pointer;
    `,

    toolbarActive: css`
      color: rgb(51, 162, 229);
    `,

    iconContainer: css`
      padding-left: 6px;
      display: inline-block;
      :hover {
        color: rgb(51, 162, 229);
      }
    `,
  };
})();

interface Props {
  value: any;
  valueFilters: string[];
  onChangeValueSearchFilter: (value: string) => void;
}

interface State {
  isInJsonMode: boolean;
}

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    isInJsonMode: false,
  };

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

  toggle(value: any) {
    if (!this.state.isInJsonMode) {
      try {
        utils.stringToJson(value);
        this.setState({ ...this.state, isInJsonMode: true });
      } catch {}
    } else {
      this.setState({ ...this.state, isInJsonMode: false });
    }
  }

  changeSearchFilter(value: any, event: any) {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  shouldHighlight(value: any): any {
    const { valueFilters } = this.props;
    let tmp = '';
    if (_.isString(value)) {
      tmp = value;
    } else if (!_.isUndefined(tmp)) {
      tmp = value.toString();
    }
    return _.some(valueFilters, (v) => tmp.indexOf(v) !== -1);
  }

  render() {
    const { value } = this.props;

    return (
      <td className={styles.td}>
        <div className={styles.toolbar}>
          <div className={`${styles.iconContainer} ${this.shouldHighlight(value) ? styles.toolbarActive : ''}`}>
            <Icon
              name="filter"
              title="添加/移除该值到筛选条件中"
              onClick={this.changeSearchFilter.bind(this, value)}
            ></Icon>
          </div>
          <div className={`${styles.iconContainer} ${this.state.isInJsonMode ? styles.toolbarActive : ''}`}>
            <Icon name="brackets-curly" onClick={this.toggle.bind(this, value)} title="JSON格式查看"></Icon>
          </div>
        </div>
        {this.state.isInJsonMode ? (
          <div>{HighlightView({ entity: utils.stringToJson(value), language: Languages.json })}</div>
        ) : (
          <div>
            <span dangerouslySetInnerHTML={{ __html: this.formatField(value) }}></span>
          </div>
        )}
      </td>
    );
  }
}
