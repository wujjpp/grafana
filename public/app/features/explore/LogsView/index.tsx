/**
 * Created by Wu Jian Ping on - 2021/04/15.
 */

import React, { Component } from 'react';
import { dateTimeParse } from '@grafana/data';
import { css, cx } from 'emotion';
import { stylesFactory, Icon, IconName } from '@grafana/ui';
import _ from 'lodash';
import statusBar from './views/StatusBar';
import DetailView from './views/DetailView';
import summaryView from './views/SummaryView';
import { ExploreId } from 'app/types/explore';

interface Props {
  exploreId: ExploreId;
  dataFrame: any;
}

interface State {
  expand: Record<string, boolean>;
  filters: string[];
}

export class LogsView extends Component<Props, State> {
  styles = getStyles();
  state: State = {
    expand: {},
    filters: [],
  };

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
      // return state.isExpand ? "minus" : "plus";
      return isExpand ? 'angle-down' : 'angle-right';
    }
    return 'plus';
  }

  // 渲染函数
  render() {
    const { dataFrame } = this.props;
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
      <div className={cx(this.styles.container, css``)}>
        <table className={this.styles.table}>
          <thead>
            {
              <tr>
                <th className={this.styles.timeCell}>日志时间</th>
                <th>日志数据</th>
              </tr>
            }
          </thead>
          <tbody>
            {values.map((v, i) => (
              <React.Fragment key={`${v['time']}-${i}`}>
                <tr onClick={this.toggle.bind(this, i)} title="点击展开或收起" style={{ cursor: 'pointer' }}>
                  <td className={this.styles.timeCell}>
                    <Icon name={this.getIconName(i)}></Icon>
                    {dateTimeParse(+v['time']).format('YYYY-MM-DD HH:mm:ss.SSS')}
                    {statusBar(v['level'])}
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

const getStyles = stylesFactory(() => {
  return {
    container: css`
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
