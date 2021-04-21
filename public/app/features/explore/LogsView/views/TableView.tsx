/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import utils from '../utils';
import _ from 'lodash';
import { stylesFactory, Icon } from '@grafana/ui';
import { css } from 'emotion';
import fieldMeta from '../fieldMeta';
import StatsBar from './StatsBar';

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

      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    iconCellActive: css`
      color: rgb(51, 162, 229);
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
  };
})();

// 格式化内容，遇到"回车"换成<br />
const formatField = (entity: any, key: string) => {
  let v = entity[key];
  if (_.isString(v) && v.indexOf('\n') !== 0) {
    v = v.replace(/\n/gi, '<br />');
  }
  return v;
};

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
  allItems: any[];
  onToggleFilter: (fieldName: string) => void;
}

export default class TableView extends React.Component<Props, Record<string, boolean>> {
  state: Record<string, boolean> = {};

  toggleMode(key: string, target: any) {
    const obj: any = {};

    obj[key] = !this.state[key];
    this.setState({ ...this.state, ...obj });
  }

  render() {
    const { entity, filters, allItems, onToggleFilter } = this.props;

    let flattenEntity = utils.flattenObject(entity);
    let keys = _.chain(flattenEntity).keys().sort().value();

    return (
      <table className={styles.tableView}>
        <tbody>
          {_.map(keys, (key) => (
            <tr title={fieldMeta.getFileDescription(key)} key={key}>
              <td className={`${styles.td} ${styles.iconCell} ${this.state[key] ? styles.iconCellActive : ''}`}>
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
              {this.state[key] ? (
                <td className={styles.td}>{StatsBar({ fieldName: key, allItems: allItems })}</td>
              ) : (
                <td className={styles.td} dangerouslySetInnerHTML={{ __html: formatField(flattenEntity, key) }}></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

// category: 100 of 100 rows have that field
