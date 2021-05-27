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
import { SearchFilterItem } from '../types';
import qs from 'querystring';

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
      width: 22px;
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
      width: 340px;
    `,

    statusLoading: css`
      margin-bottom: 0px;
      color: rgb(51, 162, 229);
    `,

    statusError: css`
      color: red;
    `,

    colorBlue: css`
      color: rgb(51, 162, 229);
    `,
  };
})();

// 获取栏位样式
const getFieldClassName = (key: string): string => {
  if (key === 'fields.error.code' || key === 'fields.error.message' || key === 'fields.error.stack') {
    return styles.statusError;
  } else if (
    key === 'fields.requestContext.requestId' ||
    key === 'fields.requestContext.userId' ||
    key === 'fields.requestContext.query' ||
    key === 'fields.requestContext.body' ||
    key === 'fields.requestContext.path' ||
    key === 'fields.requestContext.originalUrl2' ||
    key === 'fields.requestInfo.url' ||
    key === 'fields.requestInfo.urlFull' ||
    key === 'fields.requestInfo.body' ||
    key === 'fields.requestInfo.query'
  ) {
    return styles.colorBlue;
  }
  return '';
};

export interface Props {
  entity: any;
  columnFilters: string[];
  searchFilters: SearchFilterItem[];
  valueFilters: string[];
  dataSourcedId: number;
  queryText: string;
  absoluteTimeRange: AbsoluteTimeRange;
  onToggleFilter: (fieldName: string) => void;
  onChangeSearchFilter: ({ fieldName, value }: { fieldName: string; value: any }) => void;
  onChangeValueSearchFilter: (value: string) => void;
}

interface StateItem {
  label: string;
  count: number;
}

interface FieldState {
  distribution: {
    show: boolean;
    loading: boolean;
    errorMessage: string;
    items: StateItem[];
  };
  isInJsonMode: boolean;
  isInSqlMode: boolean;
}

type State = Record<string, FieldState>;

export default class TableView extends React.Component<Props, State> {
  state: State = {};

  getFieldState(key: string): FieldState {
    return (
      this.state[key] || {
        distribution: {
          show: false,
          loading: false,
          errorMessage: '',
          items: [],
        },
        isInJsonMode: false,
        isInSqlMode: false,
      }
    );
  }

  toggleMode(key: string, event: any) {
    const { queryText, absoluteTimeRange, dataSourcedId } = this.props;
    const fieldState: FieldState = this.getFieldState(key);

    fieldState.distribution.show = !fieldState.distribution.show;
    if (fieldState.distribution.show) {
      const obj: any = {};
      obj[key] = fieldState;

      fieldState.distribution.loading = true;
      tsdb
        .getDistributionByFieldName(dataSourcedId, queryText, key, absoluteTimeRange.from, absoluteTimeRange.to)
        .then((data: StateItem[]) => {
          fieldState.distribution.items = data;
          fieldState.distribution.errorMessage = '';
        })
        .catch((err) => {
          fieldState.distribution.errorMessage = err.response?.data?.message || '未知错误';
        })
        .finally(() => {
          fieldState.distribution.loading = false;
          this.setState({ ...this.state, ...obj });
        });
    }
    const obj: any = {};
    obj[key] = fieldState;
    this.setState({ ...this.state, ...obj });
  }

  changeSearchFilter({ fieldName, value }: { fieldName: string; value: any }, event: any): void {
    const { onChangeSearchFilter } = this.props;
    if (onChangeSearchFilter) {
      onChangeSearchFilter({ fieldName, value });
    }
  }

  changeValueSearchFilter(value: string, event: any): void {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  toggleJsonMode(key: string, value: any) {
    const fieldState: FieldState = this.getFieldState(key);

    const obj: any = {};
    obj[key] = fieldState;

    fieldState.isInJsonMode = !fieldState.isInJsonMode;

    if (fieldState.isInJsonMode) {
      try {
        utils.stringToJson(value);
        fieldState.isInSqlMode = false;
        this.setState({ ...this.state, ...obj });
      } catch {}
    } else {
      this.setState({ ...this.state, ...obj });
    }
  }

  toggleSqlMode(key: string, value: any) {
    const fieldState: FieldState = this.getFieldState(key);

    const obj: any = {};
    obj[key] = fieldState;

    fieldState.isInSqlMode = !fieldState.isInSqlMode;

    if (fieldState.isInJsonMode) {
      try {
        fieldState.isInJsonMode = false;
        this.setState({ ...this.state, ...obj });
      } catch {}
    } else {
      this.setState({ ...this.state, ...obj });
    }
  }

  sortObjectKeys(keys: string[]): string[] {
    const shortKeys = _.chain(keys)
      .filter((key) => key.indexOf('.') === -1)
      .sort()
      .value();
    const longKeys = _.chain(keys)
      .filter((key) => key.indexOf('.') !== -1)
      .sort()
      .value();

    return shortKeys.concat(longKeys);
  }

  render() {
    const { entity, columnFilters, onToggleFilter, valueFilters } = this.props;

    let flattenEntity = utils.flattenObject(entity);

    let path = flattenEntity['fields.requestContext.path'];
    let query = flattenEntity['fields.requestContext.query'];
    if (path && query) {
      flattenEntity['fields.requestContext.originalUrl2'] = `${path}?${qs.stringify(JSON.parse(query))}`;
    }

    let apiRequestUrl = flattenEntity['fields.requestInfo.url'];
    let apiRequestQuery = flattenEntity['fields.requestInfo.query'];
    if (apiRequestUrl && apiRequestQuery) {
      flattenEntity['fields.requestInfo.urlFull'] = `${apiRequestUrl}?${qs.stringify(JSON.parse(apiRequestQuery))}`;
    }

    let keys = this.sortObjectKeys(_.keys(flattenEntity));

    return (
      <table className={styles.tableView}>
        <tbody>
          {_.map(keys, (key) => (
            <tr title={fieldMeta.getFileDescription(key)} key={key}>
              {/* 工具按钮一 */}
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  this.state[key] && this.state[key].distribution.show ? styles.iconCellActive : ''
                }`}
                title="查看分布统计"
                onClick={this.toggleMode.bind(this, key)}
              >
                <Icon name="signal"></Icon>
              </td>

              {/* 工具按钮二 */}
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  _.includes(columnFilters, key) ? styles.iconCellActive : ''
                }`}
                onClick={() => {
                  onToggleFilter(key);
                }}
                title="在表格中添加/移除该栏位"
              >
                <Icon name="eye"></Icon>
              </td>

              {/* 工具按钮三 */}
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  _.some(this.props.searchFilters, (o) => o.name === key) ? styles.iconCellActive : ''
                }`}
                onClick={this.changeSearchFilter.bind(this, { fieldName: key, value: flattenEntity[key] })}
                title="在筛选条件添加/移除该筛选条件"
              >
                <Icon name="filter"></Icon>
              </td>

              {/* 工具按钮四 */}
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  this.state[key] && this.state[key].isInJsonMode ? styles.iconCellActive : ''
                }`}
                onClick={this.toggleJsonMode.bind(this, key, flattenEntity[key])}
                title="以JSON格式查看该栏位值"
              >
                <Icon name="brackets-curly"></Icon>
              </td>

              {/* 工具按钮五 */}
              <td
                className={`${styles.td} ${styles.iconCell} ${
                  this.state[key] && this.state[key].isInSqlMode ? styles.iconCellActive : ''
                }`}
                onClick={this.toggleSqlMode.bind(this, key, flattenEntity[key])}
                title="以SQL格式查看该栏位值"
              >
                <Icon name="wrap-text"></Icon>
              </td>

              <td className={`${styles.td} ${styles.fieldNameCell} ${getFieldClassName(key)}`}>{key}</td>
              {this.state[key] && this.state[key].distribution.show ? (
                <td className={styles.td}>
                  {this.state[key].distribution.loading ? (
                    <LoadingPlaceholder
                      text="数据分析中，请稍后..."
                      className={styles.statusLoading}
                    ></LoadingPlaceholder>
                  ) : this.state[key].distribution.errorMessage !== '' ? (
                    <div className={styles.statusError}>{this.state[key].distribution.errorMessage}</div>
                  ) : (
                    DistributionView({ items: this.state[key].distribution.items })
                  )}
                </td>
              ) : (
                <FieldView
                  onChangeValueSearchFilter={this.changeValueSearchFilter.bind(this)}
                  fieldName={key}
                  value={flattenEntity[key]}
                  valueFilters={valueFilters}
                  isInJsonMode={this.state[key] && this.state[key].isInJsonMode}
                  isInSqlMode={this.state[key] && this.state[key].isInSqlMode}
                ></FieldView>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
