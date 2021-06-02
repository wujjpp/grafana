/**
 * Created by Wu Jian Ping on - 2021/04/20.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import { AbsoluteTimeRange } from '@grafana/data';
import utils from '../utils';

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
  };
})();

interface Props {
  items: Array<{ label: string; count: number }>;
  fieldName: string;
  dataSourceInstanceName: string;
  absoluteTimeRange: AbsoluteTimeRange;
}

const DistributionView = (props: Props): JSX.Element => {
  let { items, fieldName, dataSourceInstanceName, absoluteTimeRange } = props;

  let totalRecords = _.reduce(items, (total, o) => (total += o.count), 0);
  let notNullCount = totalRecords;
  let nullCount = 0;
  let nullItem = _.find(items, (o) => o.label === 'null');
  if (nullItem) {
    nullCount = +nullItem.count || 0;
    notNullCount = totalRecords - nullCount;
  }

  let list: any[] = _.chain(items)
    .filter((o) => o.label !== 'null')
    .map((o) => {
      return {
        label: o.label,
        count: o.count,
        percent: (o.count * 100) / (notNullCount * 1.0),
      };
    })
    .orderBy(['count'], ['desc'])
    .value();

  return (
    <div className={styles.container}>
      <div className={styles.header}>{`${notNullCount} of ${totalRecords} rows have that field(limit 10000)`}</div>
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
            {_.includes(utils.SHOULD_ADD_LINK_TO_EXPLORE, fieldName) && (
              <div
                className={styles.exploreLinkContainer}
                dangerouslySetInnerHTML={{
                  __html: utils.getFieldToExploreLink(
                    fieldName,
                    o.label,
                    dataSourceInstanceName,
                    absoluteTimeRange.from,
                    absoluteTimeRange.to
                  ),
                }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

DistributionView.displayName = 'DistributionView';

export default DistributionView;
