/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import React, { Component } from 'react';
import { dateTimeParse, AbsoluteTimeRange, DataQuery, DataFrame, MutableDataFrame } from '@grafana/data';
import { css } from 'emotion';
import { stylesFactory, Icon, IconName, Switch, Pagination, LoadingPlaceholder } from '@grafana/ui';
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
import ColumnFilterView from './views/ColumnFilterView';
import DiagnosticsView from './views/DiagnosticsView';

interface Props {
  exploreId: ExploreId;
  dataSourceId: number;
  dataSourceInstanceName: string;
  width: number;
  dataFrame: DataFrame;
  updateTimeRange: (absoluteRange: AbsoluteTimeRange) => void;
}

interface State {
  expand: Record<string, boolean>;
  columnFilters: string[];
  searchFilters: SearchFilterItem[];
  valueFilters: string[];
  histograms: Array<{ time: number; count: number }>;
  timeStep: number;
  enhancedMode: boolean;
  showHistograms: boolean;

  totalRecords: number;
  numberOfPages: number;
  currentPage: number;
  shouldShowPagination: boolean;

  pagedDataFrame: MutableDataFrame;
  isLoadingPagedData: boolean;

  showDiagnostics: boolean;

  selectedLog: {
    path: string;
    method: string;
    headers: any;
    query: any;
    data: any;
  };
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
    enhancedMode: true,
    showHistograms: true,

    totalRecords: 1, // 记录条数
    numberOfPages: 1, // 最大页码
    currentPage: 1, // 当前页面
    shouldShowPagination: true, // 是否需要显示分页组件

    pagedDataFrame: tsdb.getEmptyDataFrame(),
    isLoadingPagedData: false,

    showDiagnostics: false,

    selectedLog: {
      path: '',
      method: 'GET',
      headers: {},
      query: {},
      data: {},
    },
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

  // 选择field filter
  changeSearchFilter({ fieldName, value }: { fieldName: string; value: any }): void {
    const { queries, exploreId } = this.props;
    if (queries.length > 0) {
      const q: any = queries[0];
      let queryText: string = q.queryText;
      let conditions = q.queryText;
      let analysisSql = '';

      if (queryText.indexOf('|') !== -1) {
        conditions = queryText.substr(0, queryText.indexOf('|'));
        analysisSql = queryText.substr(queryText.indexOf('|'));
      }

      if (_.isString(queryText)) {
        const exists = _.some(this.state.searchFilters, (filter) => filter.name === fieldName);
        let newSearchFilters = _.map(this.state.searchFilters, (o) => o);

        if (!exists) {
          newSearchFilters.push({ name: fieldName, operator: ':', value: value });
          conditions = `${conditions} and ${fieldName}:"${value}"`;
        } else {
          const regex1 = new RegExp(` and ${fieldName}:${value} `, 'ig');
          const regex2 = new RegExp(` and ${fieldName}:${value}`, 'ig');
          const regex3 = new RegExp(`and ${fieldName}:${value} `, 'ig');

          conditions = conditions.replace(regex1, ' ');
          conditions = conditions.replace(regex2, '');
          conditions = conditions.replace(regex3, '');
          conditions = _.trim(conditions);

          newSearchFilters = _.filter(newSearchFilters, (filter) => filter.name !== fieldName);
        }

        // 复写
        q.queryText = conditions + (analysisSql.length > 0 ? ' ' + analysisSql : '');
        // 重新初始化一个DataQuery数组
        const qs = _.map(queries, (q) => q);
        // 设置state
        this.setState({ ...this.state, searchFilters: newSearchFilters });
        // 设置查询，这边会触发真实查询
        this.props.setQueries(exploreId, qs);
      }
    }
  }

  // 选择value filter
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
            queryText = `${first} and "${value}" ${last}`;
          } else {
            queryText = `${queryText} and "${value}"`;
          }
        } else {
          const regex1 = new RegExp(` and "${value}" `, 'ig');
          const regex2 = new RegExp(` and "${value}"`, 'ig');
          const regex3 = new RegExp(`and "${value}" `, 'ig');
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

  removeColumnFilter(value: string): void {
    this.setState({ ...this.state, columnFilters: _.filter(this.state.columnFilters, (o) => o !== value) });
  }

  componentDidMount() {
    const { queryText } = this.props;
    this.initSearchFilters(queryText);
  }

  UNSAFE_componentWillReceiveProps(nextProps: any) {
    const { queryText } = nextProps;
    this.initSearchFilters(queryText);
  }

  initSearchFilters(queryText: string) {
    let conditions = queryText;
    if (conditions.indexOf('|') !== -1) {
      conditions = conditions.substr(0, conditions.indexOf('|'));
    }

    if (_.isString(conditions)) {
      // 处理search filters
      const arr = _.chain(conditions)
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
      const valueFilters = _.chain(conditions)
        .split('and')
        .filter((s) => s.indexOf(':') === -1 && _.trim(s) !== '*') // 过滤掉 filedName:value 和 "*" 的条件
        // TODO: 这边有点问题，假如值中包含"'"的话，也将被替换掉
        .map((s) => _.trim(s).replace(/"/gi, ''))
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
              dataSourceInstanceName={this.props.dataSourceInstanceName}
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
  timeRangeChanged(absoluteRange: AbsoluteTimeRange) {
    const { updateTimeRange } = this.props;
    updateTimeRange(absoluteRange);
  }

  loadHistograms() {
    const { absoluteRange, dataSourceId, queryState, queryText } = this.props;

    if (dataSourceId && queryState === 'Done' && this.histogramsStatus === HistogramsState.outdated) {
      this.histogramsStatus = HistogramsState.loading;

      tsdb
        .getHistograms(dataSourceId, absoluteRange.from, absoluteRange.to, queryText)
        .then((histogramsData) => {
          let state = {
            ...this.state,
            histograms: histogramsData.histograms,
            timeStep: histogramsData.timeStep,
          };

          this.histogramsStatus = HistogramsState.finished;
          this.setState(state);
        })
        .catch(() => {
          this.histogramsStatus = HistogramsState.finished;
        });
    }
  }

  changeEnhancedMode() {
    const enhancedMode = !this.state.enhancedMode;
    this.setState({ ...this.state, enhancedMode });
  }

  toggleHistograms() {
    const showHistograms = !this.state.showHistograms;
    this.setState({ ...this.state, showHistograms });
  }

  loadTotalRecord() {
    const { absoluteRange, dataSourceId, queryText } = this.props;

    const shouldShowPagination = queryText.indexOf('|') === -1;

    Promise.resolve()
      .then(() => {
        return shouldShowPagination
          ? tsdb.getTotalRecord(dataSourceId, absoluteRange.from, absoluteRange.to, queryText)
          : Promise.resolve(1);
      })
      .then((totalRecords) => {
        let totalPage = Math.floor(totalRecords / 100);
        if (totalRecords % 100 !== 0) {
          totalPage += 1;
        }
        let state = {
          ...this.state,
          numberOfPages: totalPage,
          totalRecords,
          shouldShowPagination,
          currentPage: 1,
        };
        this.setState(state);
      })
      .catch(() => {});
  }

  loadPageData(toPage: number) {
    const { absoluteRange, dataSourceId, queryText } = this.props;
    const offset = (toPage - 1) * 100;
    this.setState({ ...this.state, currentPage: toPage, isLoadingPagedData: true });
    tsdb
      .loadPagedData(dataSourceId, absoluteRange.from, absoluteRange.to, queryText, offset, 100)
      .then((dataFrame) => {
        this.setState({ ...this.state, pagedDataFrame: dataFrame, isLoadingPagedData: false });
      })
      .catch(() => {
        this.setState({ ...this.state, isLoadingPagedData: false });
      });
  }

  canPlay(v: any): boolean {
    if (v?.category === 'http' && v?.appName === 'nodejs-qcc-backend-data' && v?.fields?.requestContext?.path) {
      return true;
    }
    return false;
  }

  showDiagnosticsPanel(v: any, e: any) {
    e.stopPropagation();

    let path = v?.fields?.requestContext?.path;
    let query = v?.fields?.requestContext?.query;
    let headers = v?.fields?.requestContext?.headers;
    let data = v?.fields?.requestContext?.body;
    let method = v?.fields?.requestContext?.method;

    this.setState({
      ...this.state,
      showDiagnostics: true,
      selectedLog: {
        path,
        method: method || 'GET',
        query,
        headers,
        data,
      },
    });
  }

  closeDiagnosticsPanel() {
    this.setState({ ...this.state, showDiagnostics: false });
  }

  // 渲染函数
  render() {
    const { dataFrame, absoluteRange, width } = this.props;

    let frame = dataFrame;

    // load histograms
    if (this.prevTimeRangeFrom !== absoluteRange.from || this.prevTimeRangeTo !== absoluteRange.to) {
      this.prevTimeRangeFrom = absoluteRange.from;
      this.prevTimeRangeTo = absoluteRange.to;
      this.histogramsStatus = HistogramsState.outdated;

      this.loadTotalRecord();
    }

    this.loadHistograms();

    if (this.state.currentPage !== 1) {
      frame = this.state.pagedDataFrame;
    }

    // 处理表格需要的数据
    let values: any[] = [];
    let columns: string[] = _.map(frame.fields, (f) => f.name);

    if (frame.fields.length > 0) {
      const fields = frame.fields;
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

    if (!_.isEmpty(values) && values[0].time && !this.state.isLoadingPagedData) {
      values = _.sortBy(values, (o) => -o.time);
    }

    return (
      <div className={this.styles.container}>
        {/* Graph区域 */}
        {this.state.showHistograms ? (
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
        ) : (
          <></>
        )}

        <div className={this.styles.mainContainer}>
          {/* filter区域 */}

          {this.state.searchFilters.length > 0 || this.state.valueFilters.length > 0 ? (
            <>
              <div className={this.styles.filterContainer}>
                筛选条件&nbsp;:&nbsp;
                {SearchFilterView({
                  searchFilters: this.state.searchFilters,
                  onChangeSearchFilter: this.changeSearchFilter.bind(this),
                })}
                {ValueFilterView({
                  valueFilters: this.state.valueFilters,
                  onChangeValueFilter: this.changeValueSearchFilter.bind(this),
                })}
              </div>
            </>
          ) : (
            <></>
          )}

          {/* 显示栏位选择区 */}
          {this.state.columnFilters.length > 0 ? (
            <div className={this.styles.filterContainer2}>
              栏位列表&nbsp;:&nbsp;
              {ColumnFilterView({
                columnFilters: this.state.columnFilters,
                onRemoveColumnFilter: this.removeColumnFilter.bind(this),
              })}
            </div>
          ) : (
            <></>
          )}

          {/* 显示设置区 */}
          <div className={this.styles.settingsContainer}>
            <div className={this.styles.settingsItem}>
              <div className={this.styles.switchLabel}>显示时序图</div>
              <div className={this.styles.switchContainer}>
                <Switch value={this.state.showHistograms} onChange={this.toggleHistograms.bind(this)}></Switch>
              </div>
            </div>

            <div className={`${this.styles.settingsItem} ${this.styles.marginLeft10}`}>
              <div className={this.styles.switchLabel}>增强视图</div>
              <div className={this.styles.switchContainer}>
                <Switch value={this.state.enhancedMode} onChange={this.changeEnhancedMode.bind(this)}></Switch>
              </div>
            </div>
          </div>
        </div>

        {/* Request & Response Viewer */}
        {this.state.showDiagnostics && (
          <DiagnosticsView
            onClose={this.closeDiagnosticsPanel.bind(this)}
            path={this.state.selectedLog.path}
            headers={this.state.selectedLog.headers}
            query={this.state.selectedLog.query}
            data={this.state.selectedLog.data}
            method={this.state.selectedLog.method}
          ></DiagnosticsView>
        )}

        {/* 顶部Pagination */}
        {this.state.shouldShowPagination && (
          <div className={this.styles.paginationContainer} style={{ marginBottom: '6px' }}>
            <div className={this.styles.paginationInstruction}>
              总共 <span className={this.styles.paginationInstructionHighlight}>{this.state.totalRecords} </span>
              条记录，分 <span className={this.styles.paginationInstructionHighlight}>
                {this.state.numberOfPages}
              </span>{' '}
              页显示，每页 <span className={this.styles.paginationInstructionHighlight}>100</span> 条
            </div>
            <Pagination
              currentPage={this.state.currentPage}
              numberOfPages={this.state.numberOfPages}
              onNavigate={this.loadPageData.bind(this)}
              hideWhenSinglePage={!this.state.shouldShowPagination}
            />
          </div>
        )}

        {/* 表格区域 */}
        {this.state.isLoadingPagedData ? (
          <LoadingPlaceholder text="分页数据加载中，请稍后..." className={this.styles.loadingContainer} />
        ) : (
          <div className={this.styles.tableContainer}>
            {this.state.enhancedMode ? (
              <table className={this.styles.table}>
                <thead>
                  <tr>
                    <th className={this.styles.snCell}>#</th>
                    <th className={this.styles.timeCell}>日志时间</th>
                    <th>日志数据</th>
                  </tr>
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
                          {dateTimeParse(+v['time'] || +v['__time__'] * 1000).format('YYYY-MM-DD HH:mm:ss.SSS')}

                          {/* 播放按钮 */}
                          {this.canPlay(v) && (
                            <div
                              className={this.styles.playItem}
                              title="诊断接口"
                              onClick={this.showDiagnosticsPanel.bind(this, v)}
                            >
                              <Icon name="bug"></Icon>
                            </div>
                          )}
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
            ) : (
              <table className={this.styles.table}>
                <thead>
                  <tr>
                    {_.map(columns, (c, i) => (
                      <th key={i}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {values.map((v, i) => (
                    <tr key={i}>
                      {_.map(columns, (c, j) => {
                        return (
                          <td key={`${i}-${j}`} className={`${_.isPlainObject(v[c]) ? '' : this.styles.noNewline}`}>
                            {_.isPlainObject(v[c]) ? JSON.stringify(v[c], null, 2) : v[c]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 底部Pagination */}
        {this.state.shouldShowPagination && !this.state.isLoadingPagedData ? (
          <div className={this.styles.paginationContainer} style={{ marginTop: '6px' }}>
            <div className={this.styles.paginationInstruction}>
              总共 <span className={this.styles.paginationInstructionHighlight}>{this.state.totalRecords} </span>
              条记录，分 <span className={this.styles.paginationInstructionHighlight}>
                {this.state.numberOfPages}
              </span>{' '}
              页显示，每页 <span className={this.styles.paginationInstructionHighlight}>100</span> 条
            </div>
            <Pagination
              currentPage={this.state.currentPage}
              numberOfPages={this.state.numberOfPages}
              onNavigate={this.loadPageData.bind(this)}
              hideWhenSinglePage={!this.state.shouldShowPagination}
            />
          </div>
        ) : (
          <></>
        )}
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
  const dataSourceInstanceName = item.datasourceInstance?.name || '';

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
    dataSourceInstanceName,
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
      position: relative;
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
      width: 210px;
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

    filterContainer: css``,

    filterContainer2: css`
      margin-top: 10px;
    `,

    noNewline: css`
      word-break: keep-all;
      white-space: nowrap;
    `,

    mainContainer: css`
      position: relative;
      min-height: 18px;
      margin-bottom: 21px;
      padding-right: 200px;
    `,

    settingsContainer: css`
      position: absolute;
      right: 0;
      top: 2px;
    `,

    settingsItem: css`
      display: inline-block;
    `,

    switchLabel: css`
      display: inline-block;
      font-size: 12px;
      vertical-align: top;
    `,

    switchContainer: css`
      display: inline-block;
      margin-left: 4px;
    `,

    marginLeft10: css`
      margin-left: 10px;
    `,

    tableContainer: css`
      position: relative;
    `,

    paginationContainer: css`
      height: 29px;
    `,

    paginationInstruction: css`
      float: left;
    `,

    paginationInstructionHighlight: css`
      color: rgb(51, 162, 229);
      line-height: 29px;
    `,

    loadingContainer: css`
      text-align: center;
      margin-top: 32px;
    `,

    playItem: css`
      display: inline-block;
      margin-left: 6px;
      cursor: pointer;
      color: rgb(179, 179, 179);
      :hover {
        color: rgb(255, 255, 255);
      }
    `,
  };
});
