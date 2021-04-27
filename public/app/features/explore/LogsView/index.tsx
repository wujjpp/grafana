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

interface Props {
  exploreId: ExploreId;
  dataSourceId: number;
  width: number;
  dataFrame: any;
  updateTimeRange: (absoluteRange: AbsoluteTimeRange) => void;
}

interface State {
  expand: Record<string, boolean>;
  filters: string[];
  searchFilters: string[];
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
    filters: [],
    searchFilters: [],
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
    let filters = this.state.filters;
    if (_.includes(this.state.filters, fieldName)) {
      filters = _.filter(this.state.filters, (k) => k !== fieldName);
    } else {
      filters.push(fieldName);
    }
    this.setState({ ...this.state, filters });
  }

  // 选择filter
  changeSearchFilter({ fieldName, value }: { fieldName: string; value: any }): void {
    const { queries, exploreId } = this.props;
    if (queries.length > 0) {
      const q: any = queries[0];

      const exists = _.includes(this.state.searchFilters, fieldName);
      let newSearchFilters = _.map(this.state.searchFilters, (o) => o);

      if (!exists) {
        newSearchFilters.push(fieldName);
        let index = _.lastIndexOf(q.queryText, '|');
        if (index !== -1) {
          const first = q.substr(0, index);
          const last = q.substr(index);
          q.queryText = `${first} and ${fieldName}:${value} ${last}`;
        } else {
          q.queryText = `${q.queryText} and ${fieldName}:${value}`;
        }
      } else {
        const regex1 = new RegExp(` and ${fieldName}:${value} `, 'ig');
        const regex2 = new RegExp(` and ${fieldName}:${value}`, 'ig');
        const regex3 = new RegExp(`and ${fieldName}:${value} `, 'ig');

        q.queryText = q.queryText.replace(regex1, ' ');
        q.queryText = q.queryText.replace(regex2, ' ');
        q.queryText = q.queryText.replace(regex3, ' ');
        q.queryText = _.trim(q.queryText);

        newSearchFilters = _.filter(newSearchFilters, (o) => o !== fieldName);
      }

      this.setState({ ...this.state, searchFilters: newSearchFilters });

      const qs = _.map(queries, (q) => q);
      this.props.setQueries(exploreId, qs);
    }
  }

  componentDidMount() {
    const { queryText } = this.props;
    const arr = _.chain(queryText)
      .split('and')
      .filter((s) => s.indexOf(':') !== -1)
      .map((s) => _.trim(s))
      .map((s) => {
        let condition = _.split(s, ':');
        return {
          fieldName: _.trim(condition[0]),
          fieldValue: _.trim(condition[1]),
        };
      })
      .filter((o) => o.fieldValue !== '')
      .value();

    const searchFilters = _.map(arr, (o) => o.fieldName);
    this.setState({ ...this.state, searchFilters });
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
              filters={this.state.filters}
              searchFilters={this.state.searchFilters}
              dataSourceId={this.props.dataSourceId}
              queryText={this.props.queryText}
              absoluteTimeRange={this.props.absoluteRange}
              onToggleFilter={this.toggleFilter.bind(this)}
              onChangeSearchFilter={this.changeSearchFilter.bind(this)}
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
              <React.Fragment key={`${v['time']}-${i}`}>
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
                      {summaryView({ data: v, filters: this.state.filters })}
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
  };
});
