/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import React, { Component } from 'react';
import { dateTimeParse, AbsoluteTimeRange, DataQuery } from '@grafana/data';
import { css } from 'emotion';
import { stylesFactory, Icon, IconName } from '@grafana/ui';
import _ from 'lodash';
import statusBar from './views/StatusBar';
import DetailView from './views/DetailView';
import summaryView from './views/SummaryView';
import { ExploreId, ExploreItemState } from 'app/types/explore';
import tsdb from './tsdb';
import { hot } from 'react-hot-loader';
import { connect, ConnectedProps } from 'react-redux';
import { StoreState } from 'app/types';
import HistogramView from './views/HistogramView';
import { setQueries } from '../state/query';
import { SearchFilterItem } from './types';
import SearchFilterView from './views/SearchFilterView';
import ValueFilterView from './views/ValueFilterView';

interface Props {
  exploreId: ExploreId;
  dataSourceId: number;
  width: number;
  dataFrame: any;
  updateTimeRange: (absoluteRange: AbsoluteTimeRange) => void;
}

interface State {
  expand: Record<string, boolean>;
  columnFilters: string[];
  searchFilters: SearchFilterItem[];
  valueFilters: string[];
  histograms: Array<{ time: number; count: number }>;
  timeStep: number;
}

enum HistogramsState {
  outdated = 'outdated',
  loading = 'loading',
  finished = 'finished',
}

class LogsView extends Component<PropsFromRedux & Props, State> {
  styles = getStyles();
  state: State = {
    expand: {},
    columnFilters: [],
    searchFilters: [],
    valueFilters: [],
    histograms: [],
    timeStep: 1,
  };

  histogramsStatus = HistogramsState.outdated;
  prevTimeRangeFrom = 0;
  prevTimeRangeTo = 0;

  // 获取state key
  getKey(i: number): string {
    return `k_${i}`;
  }

  // 展开收起
  toggle(i: any, target: any) {
    const key = this.getKey(i);
    let expand = this.state.expand;
    expand[key] = !expand[key];
    this.setState({ ...this.state, expand });
  }

  toggleFilter(fieldName: string) {
    let columnFilters = this.state.columnFilters;
    if (_.includes(this.state.columnFilters, fieldName)) {
      columnFilters = _.filter(this.state.columnFilters, (k) => k !== fieldName);
    } else {
      columnFilters.push(fieldName);
    }
    this.setState({ ...this.state, columnFilters });
  }

  // 选择filter
  changeSearchFilter({ fieldName, value }: { fieldName: string; value: any }): void {
    const { queries, exploreId } = this.props;
    if (queries.length > 0) {
      const q: any = queries[0];
      let queryText: string = q.queryText;

      if (_.isString(queryText)) {
        const exists = _.some(this.state.searchFilters, (filter) => filter.name === fieldName);
        let newSearchFilters = _.map(this.state.searchFilters, (o) => o);

        if (!exists) {
          newSearchFilters.push({ name: fieldName, operator: ':', value: value });
          let index = queryText.indexOf('|');

          if (index !== -1) {
            const first = _.trim(queryText.substr(0, index));
            const last = _.trim(queryText.substr(index));
            queryText = `${first} and ${fieldName}:${value} ${last}`;
          } else {
            queryText = `${queryText} and ${fieldName}:${value}`;
          }
        } else {
          const regex1 = new RegExp(` and ${fieldName}:${value} `, 'ig');
          const regex2 = new RegExp(` and ${fieldName}:${value}`, 'ig');
          const regex3 = new RegExp(`and ${fieldName}:${value} `, 'ig');

          queryText = queryText.replace(regex1, ' ');
          queryText = queryText.replace(regex2, '');
          queryText = queryText.replace(regex3, '');
          queryText = _.trim(queryText);

          newSearchFilters = _.filter(newSearchFilters, (filter) => filter.name !== fieldName);
        }

        // 复写
        q.queryText = queryText;
        // 重新初始化一个DataQuery数组
        const qs = _.map(queries, (q) => q);
        // 设置state
        this.setState({ ...this.state, searchFilters: newSearchFilters });
        // 设置查询，这边会触发真实查询
        this.props.setQueries(exploreId, qs);
      }
    }
  }

  // 选择filter
  changeValueSearchFilter(value: string): void {
    const { queries, exploreId } = this.props;
    if (queries.length > 0) {
      const q: any = queries[0];
      let queryText: string = q.queryText;

      if (_.isString(queryText)) {
        const exists = _.includes(this.state.valueFilters, value);
        let newValueFilters = _.map(this.state.valueFilters, (o) => o);

        if (!exists) {
          newValueFilters.push(value);
          let index = queryText.indexOf('|');
          if (index !== -1) {
            const first = _.trim(queryText.substr(0, index));
            const last = _.trim(queryText.substr(index));
            queryText = `${first} and '${value}' ${last}`;
          } else {
            queryText = `${queryText} and '${value}'`;
          }
        } else {
          const regex1 = new RegExp(` and '${value}' `, 'ig');
          const regex2 = new RegExp(` and '${value}'`, 'ig');
          const regex3 = new RegExp(`and '${value}' `, 'ig');
          queryText = queryText.replace(regex1, ' ');
          queryText = queryText.replace(regex2, '');
          queryText = queryText.replace(regex3, '');
          queryText = _.trim(queryText);

          newValueFilters = _.filter(newValueFilters, (o) => o !== value);
        }

        q.queryText = queryText;
        // 重新初始化一个DataQuery数组
        const qs = _.map(queries, (q) => q);
        // 设置state
        this.setState({ ...this.state, valueFilters: newValueFilters });
        // 设置查询，这边会触发真实查询
        this.props.setQueries(exploreId, qs);
      }
    }
  }

  componentDidMount() {
    const { queryText } = this.props;

    if (_.isString(queryText)) {
      // 处理search filters
      const arr = _.chain(queryText)
        .split('and')
        .filter((s) => s.indexOf(':') !== -1) // 选择 fieldName:value的条件
        .map((s) => _.trim(s))
        .map(
          (s): SearchFilterItem => {
            let condition = _.split(s, ':');
            return {
              name: _.trim(condition[0]),
              operator: ':',
              value: _.trim(condition[1]),
            };
          }
        )
        .filter((o) => o.value !== '')
        .value();

      const searchFilters = _.map(arr, (filter) => filter);

      // 处理 value filters
      // 取语句前半段
      let first = queryText;
      if (first.indexOf('|') !== -1) {
        first = first.substr(0, first.indexOf('|'));
      }
      const valueFilters = _.chain(first)
        .split('and')
        .filter((s) => s.indexOf(':') === -1 && _.trim(s) !== '*') // 过滤掉 filedName:value 和 "*" 的条件
        // TODO: 这边有点问题，假如值中包含"'"的话，也将被替换掉
        .map((s) => _.trim(s).replace(/'/gi, ''))
        .value();

      this.setState({ ...this.state, searchFilters, valueFilters });
    }
  }

  // 渲染详情视图
  renderDetailView(i: number, data: any): JSX.Element {
    let isExpand = this.state.expand[this.getKey(i)];
    if (isExpand) {
      return (
        <tr className={this.styles.noHover}>
          <td colSpan={3} style={{ paddingTop: 0 }}>
            <DetailView
              index={i}
              isExpand={isExpand}
              data={data}
              columnFilters={this.state.columnFilters}
              searchFilters={this.state.searchFilters}
              valueFilters={this.state.valueFilters}
              dataSourceId={this.props.dataSourceId}
              queryText={this.props.queryText}
              absoluteTimeRange={this.props.absoluteRange}
              onToggleFilter={this.toggleFilter.bind(this)}
              onChangeSearchFilter={this.changeSearchFilter.bind(this)}
              onChangeValueSearchFilter={this.changeValueSearchFilter.bind(this)}
            ></DetailView>
          </td>
        </tr>
      );
    }
    return <></>;
  }

  // 获取IconName
  getIconName(i: number): IconName {
    let isExpand = this.state.expand[this.getKey(i)];
    return isExpand ? 'angle-down' : 'angle-right';
  }

  // Graph上选择时间区域
  timeRangeChanged(absoluteRange: AbsoluteTimeRange) {}

  loadHistograms() {
    const { absoluteRange, dataSourceId, queryState, queryText } = this.props;

    if (dataSourceId && queryState === 'Done' && this.histogramsStatus === HistogramsState.outdated) {
      this.histogramsStatus = HistogramsState.loading;
      tsdb
        .getHistograms(dataSourceId, absoluteRange.from, absoluteRange.to, queryText)
        .then((data) => {
          let state = { ...this.state, histograms: data.histograms, timeStep: data.timeStep };
          this.histogramsStatus = HistogramsState.finished;
          this.setState(state);
        })
        .catch(() => {
          this.histogramsStatus = HistogramsState.finished;
        });
    }
  }

  // 渲染函数
  render() {
    const { dataFrame, absoluteRange, width } = this.props;

    if (this.prevTimeRangeFrom !== absoluteRange.from || this.prevTimeRangeTo !== absoluteRange.to) {
      this.prevTimeRangeFrom = absoluteRange.from;
      this.prevTimeRangeTo = absoluteRange.to;
      this.histogramsStatus = HistogramsState.outdated;
    }

    this.loadHistograms();

    // 处理表格需要的数据
    let values: any[] = [];

    if (dataFrame.fields.length > 0) {
      const fields = dataFrame.fields;
      const count = fields[0].values.length;

      for (let i = 0; i < count; ++i) {
        let entity: any = {};
        _.forEach(fields, (f) => {
          let val = f.values.get(i);
          if (f.name === 'fields') {
            try {
              val = JSON.parse(val);
            } catch {}
          }
          entity[f.name] = val;
        });
        values.push(entity);
      }
    }

    return (
      <div className={this.styles.container}>
        {/* Graph区域 */}
        <div className={this.styles.graphContainer}>
          <HistogramView
            absoluteTimeRange={absoluteRange}
            height={120}
            width={width}
            histograms={this.state.histograms}
            timeStep={this.state.timeStep}
            onTimeRangeChanged={this.timeRangeChanged.bind(this)}
          ></HistogramView>
        </div>
        {/* filter区域 */}
        <div className={this.styles.filterContainer}>
          筛选条件&nbsp;&nbsp;:&nbsp;&nbsp;
          {SearchFilterView({
            searchFilters: this.state.searchFilters,
            onChangeSearchFilter: this.changeSearchFilter.bind(this),
          })}
          {ValueFilterView({
            valueFilters: this.state.valueFilters,
            onChangeValueFilter: this.changeValueSearchFilter.bind(this),
          })}
        </div>
        {/* 表格区域 */}
        <table className={this.styles.table}>
          <thead>
            {
              <tr>
                <th className={this.styles.snCell}>#</th>
                <th className={this.styles.timeCell}>日志时间</th>
                <th>日志数据</th>
              </tr>
            }
          </thead>
          <tbody>
            {values.map((v, i) => (
              <React.Fragment key={v['logId'] || `${v['time']}-${i}`}>
                <tr onClick={this.toggle.bind(this, i)} title="点击展开或收起" style={{ cursor: 'pointer' }}>
                  <td className={this.styles.snCell}>
                    {i + 1}
                    {statusBar(v['level'])}
                  </td>
                  <td className={this.styles.timeCell}>
                    <Icon name={this.getIconName(i)}></Icon>
                    {dateTimeParse(+v['time']).format('YYYY-MM-DD HH:mm:ss.SSS')}
                  </td>
                  <td>
                    <div className={this.styles.logSummary}>
                      {summaryView({ data: v, columnFilters: this.state.columnFilters })}
                    </div>
                  </td>
                </tr>
                {this.renderDetailView(i, v)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

function mapStateToProps(
  state: StoreState,
  { exploreId, absoluteRange }: { exploreId: string; absoluteRange: AbsoluteTimeRange }
) {
  const explore = state.explore;
  // @ts-ignore
  const item: ExploreItemState = explore[exploreId];
  const queries: DataQuery[] = item.queries;

  // 查询语句
  let queryText = '';
  // 查询状态
  let queryState = '';

  if (item.queries?.length > 0) {
    queryText = (item.queries[0] as any).queryText;
  }

  if (item.queryResponse?.state) {
    queryState = item.queryResponse.state;
  }

  return {
    absoluteRange,
    queryText,
    queryState,
    queries,
  };
}

const mapDispatchToProps = {
  setQueries,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default hot(module)(connector(LogsView));

const getStyles = stylesFactory(() => {
  return {
    container: css`
      position: relative;
    `,

    graphContainer: css`
      margin-bottom: 21px;
    `,

    table: css`
      width: 100%;
      border: 1px solid rgb(32, 34, 38);

      thead {
        tr {
          th {
            color: rgb(51, 162, 229);
            padding: 6px;
            border-right: 1px solid rgb(32, 34, 38);
            border-bottom: 1px solid rgb(32, 34, 38);
          }
        }
      }

      tbody {
        tr {
          :hover {
            background-color: #202226;
          }
          td {
            max-height: 130px;
            border-right: 1px solid rgb(32, 34, 38);
            border-bottom: 1px solid rgb(32, 34, 38);
            padding: 6px;
          }
        }
      }
    `,

    noHover: css`
      :hover {
        background-color: rgb(20, 22, 25) !important;
      }
    `,

    snCell: css`
      user-select: none;
      position: relative;
      text-align: center;
      width: 40px;
    `,

    timeCell: css`
      width: 200px;
      user-select: none;
      position: relative;
    `,

    logSummary: css`
      max-height: 80px;
      overflow: hidden;
      line-height: 28px;
      word-break: break-all;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
    `,

    filterContainer: css`
      margin-bottom: 21px;
    `,
  };
});
