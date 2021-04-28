/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import _ from 'lodash';
import JsonView from './JsonView';
import utils from '../utils';

require('./global.css');

const styles = stylesFactory(() => {
  return {
    td: css`
      word-wrap: break-word;
      padding-left: 50px !important;
      border: 0 !important;
      line-height: 1.5;
      position: relative;
    `,
    toolbar: css`
      position: absolute;
      left: 0px;
      top: 50%;
      margin-top: -11px;
      cursor: pointer;
    `,

    toolbarActive: css`
      color: rgb(51, 162, 229) !important;
    `,

    iconContainer: css`
      padding-left: 6px;
      display: inline-block;
      color: rgb(179, 179, 179);

      :hover {
        color: rgb(255, 255, 255);
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
  showToolbar: boolean;
}

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    isInJsonMode: false,
    showToolbar: false,
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

  changeSearchValueFilter(value: any, event: any) {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  mouseEnter() {
    this.setState({ ...this.state, showToolbar: true });
  }

  mouseLeave() {
    this.setState({ ...this.state, showToolbar: false });
  }

  render() {
    const { value, valueFilters } = this.props;

    return (
      <td className={styles.td} onMouseEnter={this.mouseEnter.bind(this)} onMouseLeave={this.mouseLeave.bind(this)}>
        {this.state.showToolbar ? (
          <div className={styles.toolbar}>
            {/* <div className={`${styles.iconContainer} ${this.shouldHighlight(value) ? styles.toolbarActive : ''}`}>
              <Icon
                name="filter"
                title="在筛选条件中添加/移除该值"
                onClick={this.changeSearchValueFilter.bind(this, value)}
              ></Icon>
            </div> */}
            <div className={`${styles.iconContainer} ${this.state.isInJsonMode ? styles.toolbarActive : ''}`}>
              <Icon name="brackets-curly" onClick={this.toggle.bind(this, value)} title="JSON格式查看"></Icon>
            </div>
          </div>
        ) : (
          <></>
        )}
        {this.state.isInJsonMode ? (
          <div>
            <JsonView
              entity={utils.stringToJson(value)}
              onValueClick={this.changeSearchValueFilter.bind(this)}
              valueFilters={valueFilters}
            ></JsonView>
          </div>
        ) : (
          <div>
            <span dangerouslySetInnerHTML={{ __html: this.formatField(value) }}></span>
          </div>
        )}
      </td>
    );
  }
}
