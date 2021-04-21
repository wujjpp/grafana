/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import React, { PureComponent } from 'react';
import TableView from './TableView';
import jsonView from './JsonView';
import { css } from 'emotion';
import { stylesFactory } from '@grafana/ui';
// import statusBar from './StatusBar';

interface Props {
  index: number;
  isExpand: boolean;
  data: any;
  allItems: any[];
  filters: string[];
  onToggleFilter: (fieldName: string) => void;
}

enum ViewMode {
  Table = 'table',
  JSON = 'json',
}

export default class DetailView extends PureComponent<Props> {
  styles = getStyles();

  state = {
    viewMode: ViewMode.Table,
  };

  changeMode(mode: ViewMode) {
    if (mode !== this.state.viewMode) {
      this.setState({ ...this.state, viewMode: mode });
    }
  }

  render() {
    const { isExpand, data, filters, allItems, onToggleFilter } = this.props;
    return isExpand ? (
      <div className={this.styles.container}>
        {/* {statusBar(data['level'])} */}
        <div className={this.styles.tabContainer}>
          <div
            className={`${this.styles.tabItem} ${this.state.viewMode === ViewMode.Table ? this.styles.tabActive : ''}`}
            onClick={this.changeMode.bind(this, ViewMode.Table)}
          >
            Table
          </div>
          <div
            className={`${this.styles.tabItem} ${this.state.viewMode === ViewMode.JSON ? this.styles.tabActive : ''}`}
            onClick={this.changeMode.bind(this, ViewMode.JSON)}
          >
            JSON
          </div>
        </div>
        <div className={this.styles.viewContainer}>
          {this.state.viewMode === ViewMode.JSON ? (
            jsonView({ entity: data, filters })
          ) : (
            <TableView entity={data} filters={filters} onToggleFilter={onToggleFilter} allItems={allItems}></TableView>
          )}
        </div>
      </div>
    ) : (
      <div></div>
    );
  }
}

const getStyles = stylesFactory(() => {
  return {
    container: css`
      position: relative;
      margin-left: -6px;
      margin-right: -6px;
      padding: 20px;
      padding-bottom: 0;
    `,

    tabContainer: css`
      position: relative;
      display: flex;
    `,
    tabItem: css`
      width: 60px;
      text-align: center;
      line-height: 32px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      user-select: none;
      border-bottom: 2px solid transparent;
    `,

    tabActive: css`
      color: rgb(51, 162, 229);
      border-bottom: 2px solid rgb(51, 162, 229);
    `,

    viewContainer: css`
      margin-bottom: 6px;
      padding-top: 0;
      border-top: 1px solid rgb(32, 34, 38);
      border-bottom: 1px solid rgb(32, 34, 38);
      border-left: 1px solid rgb(32, 34, 38);
      border-right: 1px solid rgb(32, 34, 38);
    `,
  };
});
