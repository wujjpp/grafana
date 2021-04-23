/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import React, { Component } from 'react';
import {
  dateTimeParse,
  dateTime,
  TimeRange,
  AbsoluteTimeRange,
  GraphSeriesXY,
  MutableDataFrame,
  FieldType,
  Field,
} from '@grafana/data';
import { css } from 'emotion';
import { stylesFactory, Icon, IconName, Graph } from '@grafana/ui';
import _ from 'lodash';
import statusBar from './views/StatusBar';
import DetailView from './views/DetailView';
import summaryView from './views/SummaryView';
import { ExploreId, ExploreItemState } from 'app/types/explore';
import tsdb from './tsdb';
import { hot } from 'react-hot-loader';
import { connect, ConnectedProps } from 'react-redux';
import { StoreState } from 'app/types';

interface Props {
  exploreId: ExploreId;
  dataSourceId?: number;
  width: number;
  dataFrame: any;
  updateTimeRange: (absoluteRange: AbsoluteTimeRange) => void;
}

interface State {
  expand: Record<string, boolean>;
  filters: string[];
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
    histograms: [],
    timeStep: 1000,
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

  // 渲染详情视图
  renderDetailView(i: number, data: any, allItems: any[]): JSX.Element {
    let isExpand = this.state.expand[this.getKey(i)];
    if (isExpand) {
      return (
        <tr className={this.styles.noHover}>
          <td colSpan={3} style={{ paddingTop: 0 }}>
            <DetailView
              index={i}
              isExpand={isExpand}
              data={data}
              allItems={allItems}
              filters={this.state.filters}
              onToggleFilter={this.toggleFilter.bind(this)}
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
    if (isExpand) {
      return isExpand ? 'angle-down' : 'angle-right';
    }
    return 'plus';
  }

  // Graph上选择时间区域
  timeRangeChanged(from: number, to: number) {
    const { updateTimeRange } = this.props;
    updateTimeRange({ from, to });
  }

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

    // 用来兼容
    if (this.prevTimeRangeFrom !== absoluteRange.from || this.prevTimeRangeTo !== absoluteRange.to) {
      this.prevTimeRangeFrom = absoluteRange.from;
      this.prevTimeRangeTo = absoluteRange.to;
      this.histogramsStatus = HistogramsState.outdated;
    }

    this.loadHistograms();

    // 处理Histograms
    const frame = new MutableDataFrame({
      fields: [
        {
          name: 'time',
          type: FieldType.time,
        },
        {
          name: 'count',
          type: FieldType.number,
        },
      ],
    });

    const graphSeriesXY: GraphSeriesXY = {
      data: [],
      isVisible: true,
      label: '',
      yAxis: {
        index: 0,
        tickDecimals: 0,
      },
      timeField: frame.fields.find((o) => o.name === 'time') as Field,
      valueField: frame.fields.find((o) => o.name === 'count') as Field,
      seriesIndex: 0,
      timeStep: 1,
    };

    _.forEach(this.state.histograms, (o) => {
      graphSeriesXY.data.push([o.time, o.count]);
      frame.add({ time: o.time, count: o.count });
    });

    // 处理Graph所需的TimeRange
    const timeRange: TimeRange = {
      from: dateTime(absoluteRange.from),
      to: dateTime(absoluteRange.to),
      raw: {
        from: dateTime(absoluteRange.from),
        to: dateTime(absoluteRange.to),
      },
    };

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
          <Graph
            timeRange={timeRange}
            height={100}
            width={width}
            series={[graphSeriesXY]}
            onHorizontalRegionSelected={this.timeRangeChanged.bind(this)}
          ></Graph>
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
                {this.renderDetailView(i, v, values)}
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
  };
}

const mapDispatchToProps = {};

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
