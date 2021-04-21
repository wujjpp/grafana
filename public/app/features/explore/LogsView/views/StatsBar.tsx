/**
 * Created by Wu Jian Ping on - 2021/04/20.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import utils from '../utils';

const styles = stylesFactory(() => {
  return {
    container: css`
      position: relative;
      display: inline-block;
      min-width: 300px;
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
      color: rgb(199, 208, 217);
      word-break: break-all;
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
  };
})();

interface Props {
  fieldName: string;
  allItems: any[];
}

// { title: `${key}: 100 of 100 rows have that field`, items: [] }

const StatsBar = (props: Props): JSX.Element => {
  let { fieldName, allItems } = props;
  // 这边只有点了signal按钮之后才会渲染，因此不考虑前端性能问题

  // 展平数据
  const flattenItems = _.map(allItems, (o) => utils.flattenObject(o));
  // 记录条数
  const totalRecord = flattenItems.length;
  // 包含对应属性的记录条数
  let matchedCount = 0;

  const agg: Record<string, number> = {};

  _.forEach(flattenItems, (o) => {
    let val = o[fieldName];
    if (!_.isUndefined(val)) {
      matchedCount += 1;
      if (agg[val]) {
        agg[val] = agg[val] + 1;
      } else {
        agg[val] = 1;
      }
    }
  });

  const items: any[] = _.chain(agg)
    .keys()
    .map((key) => {
      return {
        label: key,
        count: agg[key],
      };
    })
    .value();

  let list: any[] = _.chain(items)
    .map((o) => {
      return {
        label: o.label,
        count: o.count,
        percent: (o.count * 100) / (matchedCount * 1.0),
      };
    })
    .orderBy(['count'], ['desc'])
    .value();

  return (
    <div className={styles.container}>
      <div className={styles.header}>{`${matchedCount} of ${totalRecord} rows have that field`}</div>
      <div className={styles.body}>
        {_.map(list, (o) => (
          <div className={styles.statsRow} key={`${o.label}-${o.count}`}>
            <div className={styles.statsRowLabel}>
              <div className={styles.statsRowLabelValue}>{o.label}</div>
              <div className={styles.statsRowLabelCount}>{o.count}</div>
              <div className={styles.statsRowLabelPercent}>{o.percent.toFixed(0)}%</div>
            </div>
            <div className={styles.statsRowBar}>
              <div className={styles.statsRowBarInner} style={{ width: o.percent + '%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

StatsBar.displayName = 'StatsBar';

export default StatsBar;
