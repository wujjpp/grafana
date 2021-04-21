/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import utils from '../utils';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';

const styles = stylesFactory(() => {
  return {
    dt: css`
      display: inline;
      padding: 2px 4px 0px 4px;
      margin-right: 4px;
      word-break: normal;
      border-radius: 4px;
      background-color: rgb(32, 34, 38);
      // color: rgb(115, 191, 105);
      color: rgb(51, 162, 229);
    `,
    dd: css`
      display: inline;
      margin-right: 10px;
    `,
  };
})();

const SummaryView = ({ data, filters }: { data: any; filters: string[] }): JSX.Element => {
  let o = utils.flattenObject(data);
  let keys = [];

  if (filters.length > 0) {
    keys = _.chain(filters).sort().value();
  } else {
    keys = _.chain(o).keys().sort().value();
  }

  return (
    <dl>
      {_.map(keys, (k) => (
        <React.Fragment key={k}>
          <dt key={`dt-${k}`} className={styles.dt}>
            {k}:{' '}
          </dt>
          <dd key={`dd-${k}`} className={styles.dd}>
            {'"' + o[k] + '"'}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};

SummaryView.displayName = 'SummaryView';

export default SummaryView;
