/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import _ from 'lodash';
import JsonView from './JsonView';
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
  };
})();

interface Props {
  isInJsonMode: boolean;
  value: any;
  valueFilters: string[];
  onChangeValueSearchFilter: (value: string) => void;
}

interface State {
  showToolbar: boolean;
}

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
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

  changeSearchValueFilter(value: any, event: any) {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  render() {
    const { value, valueFilters, isInJsonMode } = this.props;

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
        ) : (
          <div>
            <span dangerouslySetInnerHTML={{ __html: this.formatField(value) }}></span>
          </div>
        )}
      </td>
    );
  }
}
