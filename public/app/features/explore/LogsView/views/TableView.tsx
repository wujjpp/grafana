/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import utils from '../utils';
import _ from 'lodash';
import { stylesFactory, Icon, LoadingPlaceholder } from '@grafana/ui';
import { css } from 'emotion';
import fieldMeta from '../fieldMeta';
import DistributionView from './DistributionView';
import FieldView from './FieldView';
import { AbsoluteTimeRange } from '@grafana/data';
import tsdb from '../tsdb';

const styles = stylesFactory(() => {
  return {
    tableView: css`
      table-layout: fixed;
      word-break: break-all;
      // border: 1px solid rgb(32, 34, 38);
      // border-top: 0;
      border: 0 !important;
      width: 100%;
    `,

    td: css`
      word-wrap: break-word;
      // border-bottom: 1px solid rgb(32, 34, 38);
      padding: 6px;
      border: 0 !important;
      line-height: 1.5;
      // letter-spacing: 1px;
    `,

    iconCell: css`
      width: 28px;
      text-align: center;
      cursor: pointer;
      color: rgb(179, 179, 179);
      // vertical-align: text-top;

      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    iconCellActive: css`
      color: rgb(51, 162, 229) !important;
      :hover {
        color: rgb(51, 162, 229) !important;
      }
    `,

    fieldNameCell: css`
      width: 360px;
    `,

    highlight: css`
      color: red;
    `,

    loading: css`
      margin-bottom: 0px;
    `,
  };
})();

// 获取栏位样式
const getFieldClassName = (key: string) => {
  if (key === 'fields.error.stack') {
    return styles.highlight;
  }
  return '';
};

export interface Props {
  entity: any;
  filters: string[];
  dataSourcedId: number;
  queryText: string;
  absoluteTimeRange: AbsoluteTimeRange;
  onToggleFilter: (fieldName: string) => void;
}

interface StateItem {
  label: string;
  count: number;
}

interface FieldState {
  show: boolean;
  loading: boolean;
  items: StateItem[];
}

type State = Record<string, FieldState>;

export default class TableView extends React.Component<Props, State> {
  state: State = {};

  toggleMode(key: string, target: any) {
    const { queryText, absoluteTimeRange, dataSourcedId } = this.props;
    const fieldState: FieldState = this.state[key] || { show: false, loading: false, items: [] };

    fieldState.show = !fieldState.show;
    if (fieldState.show) {
      const obj: any = {};
      obj[key] = fieldState;

      fieldState.loading = true;
      tsdb
        .getDistributionByFieldName(dataSourcedId, queryText, key, absoluteTimeRange.from, absoluteTimeRange.to)
        .then((data: StateItem[]) => {
          fieldState.items = data;
          fieldState.loading = false;
          this.setState({ ...this.state, ...obj });
        })
        .catch((err) => {})
        .finally(() => {
          fieldState.loading = false;
        });
    }
    const obj: any = {};
    obj[key] = fieldState;
    this.setState({ ...this.state, ...obj });
  }

  render() {
    const { entity, filters, onToggleFilter } = this.props;

    let flattenEntity = utils.flattenObject(entity);
    let keys = _.chain(flattenEntity).keys().sort().value();

    return (
      <table className={styles.tableView}>
        <tbody>
          {_.map(keys, (key) => (
            <tr title={fieldMeta.getFileDescription(key)} key={key}>
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  this.state[key] && this.state[key].show ? styles.iconCellActive : ''
                }`}
              >
                <Icon name="signal" onClick={this.toggleMode.bind(this, key)}></Icon>
              </td>
              <td
                className={`${styles.td} ${styles.iconCell} ${_.includes(filters, key) ? styles.iconCellActive : ''}`}
              >
                <Icon
                  name="eye"
                  onClick={() => {
                    onToggleFilter(key);
                  }}
                ></Icon>
              </td>
              <td className={`${styles.td} ${styles.fieldNameCell} ${getFieldClassName(key)}`}>{key}</td>
              {this.state[key] && this.state[key].show ? (
                <td className={styles.td}>
                  {this.state[key].loading ? (
                    <LoadingPlaceholder text="数据分析中，请稍后..." className={styles.loading}></LoadingPlaceholder>
                  ) : (
                    DistributionView({ items: this.state[key].items })
                  )}
                </td>
              ) : (
                <FieldView value={flattenEntity[key]}></FieldView>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
