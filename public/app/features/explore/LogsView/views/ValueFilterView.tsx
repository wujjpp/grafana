/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory, Icon } from '@grafana/ui';
import { css } from 'emotion';

const styles = stylesFactory(() => {
  return {
    filterItem: css`
      display: inline-block;
      line-height: 1;
      background: #202226;
      border-radius: 2px;
      margin: 0 8px 2px 0;
      padding: 2px 2px 2px 2px;
      color: #c7d0d9;
    `,

    firstFilterItem: css`
      margin-left: 0px;
      display: inline-block;
    `,

    filterContainer: css`
      display: inline-block;
    `,

    filedName: css`
      display: inline-block;
      color: rgb(51, 162, 229);
    `,

    fieldValue: css`
      display: inline-block;
    `,

    removeContainer: css`
      cursor: pointer;
      display: inline-block;
      margin-left: 4px;
      color: rgb(179, 179, 179);
      :hover {
        color: rgb(255, 255, 255);
      }
    `,
  };
})();

const ValueFilterView = ({
  valueFilters,
  onChangeValueFilter,
}: {
  valueFilters: string[];
  onChangeValueFilter: (value: string) => void;
}): JSX.Element => {
  return (
    <>
      {_.map(valueFilters, (v, n) => {
        return (
          <div className={`${styles.filterItem} ${n === 0 ? styles.firstFilterItem : ''}`} key={v}>
            <div className={styles.filterContainer}>
              <div className={styles.fieldValue}>{v} </div>
            </div>
            <div
              className={styles.removeContainer}
              onClick={() => {
                if (onChangeValueFilter) {
                  onChangeValueFilter(v);
                }
              }}
              title="移除该查询条件"
            >
              <Icon name="trash-alt" size="sm"></Icon>
            </div>
          </div>
        );
      })}
    </>
  );
};

ValueFilterView.displayName = 'ValueFilterView';

export default ValueFilterView;
