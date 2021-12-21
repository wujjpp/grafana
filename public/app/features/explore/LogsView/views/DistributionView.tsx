/**
 * Created by Wu Jian Ping on - 2021/04/20.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory, Pagination, Select, Label } from '@grafana/ui';
import { css } from 'emotion';
import { AbsoluteTimeRange } from '@grafana/data';
import utils from '../utils';

const pageSizeOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

const styles = stylesFactory(() => {
  return {
    container: css`
      position: relative;
      display: inline-block;
      min-width: 320px;
    `,
    header: css`
      border-bottom: 1px solid rgb(44, 50, 53);
      display: flex;
    `,
    body: css`
      padding: 5px 0px;
    `,

    statsRow: css`
      margin: 9.14286px 0px;
      padding-right: 28px;
      color: rgb(199, 208, 217);
      word-break: break-all;
      position: relative;
    `,

    exploreLinkContainer: css`
      position: absolute;
      top: 50%;
      right: 0;
      margin-top: -2px;
    `,

    statsRowLabel: css`
      display: flex;
      margin-bottom: 1px;
    `,

    statsRowLabelValue: css`
      flex: 1 1 0%;
      text-overflow: ellipsis;
      overflow: hidden;
    `,

    statsRowLabelCount: css`
      text-align: right;
      margin-left: 0.5em;
    `,

    statsRowLabelPercent: css`
      text-align: right;
      margin-left: 0.5em;
      width: 3em;
    `,

    statsRowBar: css`
      height: 4px;
      overflow: hidden;
      background: rgb(70, 76, 84);
    `,
    statsRowBarInner: css`
      height: 4px;
      overflow: hidden;
      background: rgb(50, 116, 217);
    `,

    pagerContainer: css`
      display: flex;
      align-items: flex-end;
    `,

    pagerLabelContainer: css`
      margin-right: 8px;
      padding-bottom: 4px;
    `,
  };
})();

interface Props {
  items: Array<{ label: string; count: number }>;
  fieldName: string;
  dataSourceInstanceName: string;
  absoluteTimeRange: AbsoluteTimeRange;
}

interface State {
  pageSize: number;
  currentPage: number;
  currentList: Array<{ label: string; count: number; percent: number }>;
  list: Array<{ label: string; count: number; percent: number }>;
  totalRecords: number;
  notNullCount: number;
}

class DistributionView extends React.Component<Props, State> {
  state: State = {
    list: [],
    pageSize: 20,
    currentPage: 1,
    currentList: [],
    totalRecords: 0,
    notNullCount: 0,
  };

  componentDidMount() {
    const { items } = this.props;
    if (items) {
      let totalRecords = _.reduce(items, (total, o) => (total += o.count), 0);
      let notNullCount = totalRecords;
      let nullCount = 0;
      let nullItem = _.find(items, (o) => o.label === 'null');
      if (nullItem) {
        nullCount = +nullItem.count || 0;
        notNullCount = totalRecords - nullCount;
      }

      const list = _.chain(items)
        .map((o) => {
          return {
            label: o.label,
            count: o.count,
            percent: (o.count * 100) / (totalRecords * 1.0),
          };
        })
        .orderBy(['count'], ['desc'])
        .value();
      const currentList = list.slice(0, this.state.pageSize);

      this.setState({
        ...this.state,
        list,
        currentList,
        totalRecords,
        notNullCount,
      });
    }
  }

  changeCurrentPage = (num: number) => {
    const { list, pageSize } = this.state;
    const currentList = list.slice((num - 1) * pageSize, num * pageSize);

    this.setState({ ...this.state, currentList, currentPage: num });
  };

  changePageSize = (pageSize: number) => {
    const { list } = this.state;
    const currentList = list.slice(0, pageSize);
    this.setState({ ...this.state, pageSize, currentList, currentPage: 1 });
  };

  render() {
    const { fieldName, dataSourceInstanceName, absoluteTimeRange } = this.props;
    const { list, currentPage, currentList, totalRecords, notNullCount, pageSize } = this.state;
    const totalPage = Math.ceil(list.length / pageSize);

    return (
      <div className={styles.container}>
        <div
          className={styles.header}
        >{`${notNullCount} of ${totalRecords} rows have that field(display limit 10000 items)`}</div>
        <div className={styles.body}>
          {_.map(currentList, (o) => (
            <div className={styles.statsRow} key={`${o.label}-${o.count}`}>
              <div className={styles.statsRowLabel}>
                <div className={styles.statsRowLabelValue}>{o.label}</div>
                <div className={styles.statsRowLabelCount}>{o.count}</div>
                <div className={styles.statsRowLabelPercent}>{o.percent.toFixed(0)}%</div>
              </div>
              <div className={styles.statsRowBar}>
                <div className={styles.statsRowBarInner} style={{ width: o.percent + '%' }}></div>
              </div>
              {_.includes(utils.SHOULD_ADD_LINK_TO_EXPLORE, fieldName) && (
                <div
                  className={styles.exploreLinkContainer}
                  dangerouslySetInnerHTML={{
                    __html: utils.getFieldToExploreLink(
                      fieldName,
                      o.label,
                      dataSourceInstanceName,
                      absoluteTimeRange.from,
                      absoluteTimeRange.to,
                      o.label === 'null'
                    ),
                  }}
                ></div>
              )}
            </div>
          ))}
          {/* 这边直接用div来控制上下位置，只能这么干 */}
          {totalPage > 1 && (
            <div className={styles.pagerContainer}>
              <div className={styles.pagerLabelContainer}>
                <Label>Items per page</Label>
              </div>
              <div>
                <Select
                  autoFocus={false}
                  options={pageSizeOptions}
                  value={pageSize}
                  onChange={(v: any) => {
                    this.changePageSize(v.value);
                  }}
                />
              </div>
              <div>
                <Pagination currentPage={currentPage} numberOfPages={totalPage} onNavigate={this.changeCurrentPage} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default DistributionView;
