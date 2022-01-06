/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory, Drawer, LoadingPlaceholder } from '@grafana/ui';
import { AbsoluteTimeRange } from '@grafana/data';
import { css } from 'emotion';
import _ from 'lodash';
import JsonView from './JsonView';
import SqlView from './SqlView';
import utils from '../utils';
import copy from 'copy-to-clipboard';
import tsdb from '../tsdb';
import '../../libs/lite.render';
import { v4 as uuid } from 'uuid';
import Panzoom from '@panzoom/panzoom';

const moment = require('moment');

const dot = require('../../libs/dot').default;

require('./global.css');

const styles = stylesFactory(() => {
  return {
    td: css`
      word-wrap: break-word;
      border: 0 !important;
      line-height: 1.5;
      position: relative;
    `,

    expandedContainer: css`
      position: relative;
    `,

    contentContainer: css`
      max-height: 360px;
      overflow: hidden;
    `,

    fieldContextContainer: css`
      padding-right: 20px;
    `,

    toolbarContainer: css`
      position: absolute;
      right: 0;
      top: 0;
    `,

    toolbarItem: css`
      position: relative;
      display: inline-block;
      cursor: pointer;
      color: rgb(179, 179, 179);
      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    toolbarItemActive: css`
      color: rgb(51, 162, 229) !important;
    `,

    toggleContainer: css`
      text-align: center;
      cursor: pointer;
      color: rgb(179, 179, 179);
      background-color: #202226;
      padding-right: 20px;

      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    flow: css`
      // position: absolute;
      // left: 0;
      // right: 0;
      // bottom: 0;
    `,

    statusError: css`
      color: red;
    `,

    colorTrace: css`
      color: rgb(110, 208, 224);
      font-weight: 700;
    `,

    colorDebug: css`
      color: blue;
      font-weight: 700;
    `,

    colorInfo: css`
      color: green;
      font-weight: 700;
    `,

    colorWarn: css`
      color: yellow;
      font-weight: 700;
    `,

    colorError: css`
      color: red;
      font-weight: 700;
    `,

    colorFatal: css`
      color: purple;
      font-weight: 700;
    `,

    colorBlue: css`
      color: rgb(51, 162, 229);
    `,

    viewGraphContainer: css`
      display: inline-block;
      margin-left: -16px;
      cursor: pointer;
      vertical-align: middle;
    `,
  };
})();

interface Props {
  isInJsonMode: boolean;
  isInSqlMode: boolean;
  fieldName: string;
  value: any;
  valueFilters: string[];
  onChangeValueSearchFilter: (value: string) => void;
  dataSourceInstanceName: string;
  dataSourceId: number;
  absoluteTimeRange: AbsoluteTimeRange;
}

interface State {
  expanded: boolean;
  graphViewOpened: boolean;
  isLoadingGraph: boolean;
  grahpData: any[];
  svg: any;
}

// 获取栏位样式
const getFieldClassName = (key: string, value: any): string => {
  let className = '';
  if (key === 'fields.error.message') {
    className = styles.statusError;
  } else if (key === 'level') {
    switch (value) {
      case 'TRACE':
        className = styles.colorTrace;
        break;
      case 'DEBUG':
        className = styles.colorDebug;
        break;
      case 'INFO':
        className = styles.colorInfo;
        break;
      case 'WARN':
        className = styles.colorWarn;
        break;
      case 'ERROR':
        className = styles.colorError;
        break;
      case 'FATAL':
        className = styles.colorFatal;
        break;
    }
  } else if (
    key === 'appName' ||
    key === 'category' ||
    key === 'fields.eventType' ||
    key === 'fields.requestInfo.urlFull'
  ) {
    className = styles.colorBlue;
  }

  return className;
};

const getNodeNamesFromEdgeId = (edgeId?: string): string[] | undefined => {
  const tmp = edgeId?.split(':')[0];
  const nodes = tmp?.split('->');
  return nodes;
};
export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    expanded: false,
    graphViewOpened: false,
    isLoadingGraph: false,
    grahpData: [],
    svg: null,
  };

  container: HTMLElement | null;
  toggleBtn: HTMLElement | null;
  graphViewContainer: HTMLElement | null;
  zoomObject: any;

  getFileldLink(fieldName: string, fieldValue: string): string {
    const { dataSourceInstanceName, absoluteTimeRange } = this.props;
    const { from, to } = absoluteTimeRange;
    return utils.getFieldToExploreLink(fieldName, fieldValue, dataSourceInstanceName, from, to);
  }

  // 格式化内容，遇到"回车"换成<br />
  formatField(fieldName: string, v: any) {
    if (fieldName === 'time' && _.isString(v) && v.length === 13) {
      return moment(+v).format('YYYY-MM-DD HH:mm:ss.SSS') + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${v})`;
    }

    // 处理换行
    if (_.isString(v) && v.indexOf('\n') !== 0) {
      v = v.replace(/\n/gi, '<br />');
    }

    if (!_.isString(v) && v !== undefined && v !== null) {
      v = v.toString();
    }

    // 处理高亮
    if (this.props.valueFilters.length > 0 && v) {
      const matches = _.map(this.props.valueFilters, (key) => {
        return {
          regexp: new RegExp(`${key}`, 'ig'),
          key: key,
        };
      });

      _.forEach(matches, (match) => {
        v = v.replace(match.regexp, `<em>${match.key}</em>`);
      });
    }

    if (_.includes(utils.SHOULD_ADD_LINK_TO_EXPLORE, fieldName)) {
      v = `${v}&nbsp;&nbsp;${this.getFileldLink(fieldName, v)}`;
    }

    return v;
  }

  changeSearchValueFilter(value: any, event: any) {
    const { onChangeValueSearchFilter } = this.props;
    if (onChangeValueSearchFilter) {
      onChangeValueSearchFilter(value);
    }
  }

  // 拼接生成graph的tooltip
  generateGraphToolTip(obj: any) {
    let str = '';
    _.forIn(obj, (value, key) => {
      if (!_.isObject(value)) {
        str += `${key}：${value}&#10;`;
      }
    });
    return str;
  }

  getGraphLink(logId: string) {
    const { dataSourceInstanceName } = this.props;
    const params = ['now/y', 'now', dataSourceInstanceName, { queryText: `* and logId:"${logId}"` }];
    const target = `/explore?orgId=1&left=${encodeURIComponent(JSON.stringify(params))}`;
    return target;
  }

  showGraphView(requestId: string) {
    this.setState({ ...this.state, graphViewOpened: !this.state.graphViewOpened, isLoadingGraph: true });

    // 关闭Drawer不重新进行渲染
    if (this.state.graphViewOpened) {
      return;
    }

    const { dataSourceId, absoluteTimeRange } = this.props;
    const { from, to } = absoluteTimeRange;

    tsdb
      .getRequestGraphByRequestId(dataSourceId, from, to, requestId)
      .then((data) => {
        const grahpData: any[] = [];
        const nodeColor = '#5B8FF9';
        const nodeFontColor = '#5B8FF9';
        const edgeColor = '#c7d0d9';
        const edgeFontColor = '#5B8FF9';

        // 这里处理数据
        _.forEach(data, (o) => {
          grahpData.push(o);
        });

        let nodes: any[] = [];
        let edges: any[] = [];
        let newData = data[0] || [];

        _.forEach(newData, (x) => {
          let fields = JSON.parse(x.fields);
          edges.push({
            id: x.logId || uuid(),
            source: fields.requestContext.requestFromAppName,
            target: x.appName,
            label: `${x.timeString}, ${fields.http.httpStatus || ''}`,
            labeltooltip: this.generateGraphToolTip({ ...x, fields }),
            url: this.getGraphLink(x.logId),
          });
          nodes.push({
            name: x.appName,
          });
          if (fields.requestContext.requestFromAppName) {
            nodes.push({
              name: fields.requestContext.requestFromAppName,
            });
          }
        });

        const nodeStrings = _.reduce(
          nodes,
          (sum, o) => {
            return `${sum}"${o.name}" [id="${o.name}"; color="${o.color || nodeColor}";fontcolor="${
              o.fontColor || nodeFontColor
            }"];`;
          },
          ''
        );
        const edgeStrings = _.reduce(
          edges,
          (sum, o) => {
            return o.source
              ? `${sum}"${o.source}" -> "${o.target}" [id="${o.source}->${o.target}:${o.id}"; label="${
                  o.label
                }"; labeltooltip="${o.labeltooltip}"; URL="${o.url}"; target="_blank"; color="${
                  o.color || edgeColor
                }";fontcolor="${o.fontColor || edgeFontColor}"];`
              : `${sum}`;
          },
          ''
        );
        const dotString = `digraph {
          bgcolor="transparent";
          fontsize=20;
          rankdir="LR";
          node [fontname="Verdana"; size="1,1"; fontsize=12; color="${nodeColor}"; fontcolor="${nodeFontColor}"];
          edge [arrowhead=vee; fontname="Verdana"; fontsize=12; fontcolor="${edgeFontColor}"; color="${edgeColor}"];
          ${nodeStrings}
          ${edgeStrings}
        }`;
        const svg = dot`${dotString}`;
        const $svg = $(svg);
        console.log(svg);
        // 应该直接画图
        this.setState({ ...this.state, grahpData, svg: $svg[0] ? $svg[0].outerHTML : '' });
      })
      .catch(() => {})
      .finally(() => {
        this.setState({ ...this.state, isLoadingGraph: false });
        console.log(this.state.grahpData);
      });
  }

  componentDidMount() {
    if (this.container) {
      const height = $(this.container).height();
      if (height !== undefined && height > 360) {
        $(this.container).addClass(styles.contentContainer);
        if (this.toggleBtn) {
          $(this.toggleBtn).addClass(styles.flow).show();
        }
      } else {
        if (this.toggleBtn) {
          $(this.toggleBtn).hide();
        }
      }
    }
  }

  componentDidUpdate() {
    const { isInJsonMode, isInSqlMode } = this.props;

    if (!isInJsonMode && !isInSqlMode) {
      if (this.container) {
        if (this.container) {
          if (!this.state.expanded) {
            $(this.container).addClass(styles.contentContainer);
            if (this.toggleBtn) {
              $(this.toggleBtn).addClass(styles.flow);
            }
          } else {
            $(this.container).removeClass(styles.contentContainer);
            if (this.toggleBtn) {
              $(this.toggleBtn).removeClass(styles.flow);
            }
          }
        }
      }
    }

    if (this.graphViewContainer) {
      $('.edge')
        .on('mouseover', (e) => {
          $(e.target).parents('.edge').addClass('active');
          const edgeId = $(e.target).parents('.edge').attr('id');
          const nodes = getNodeNamesFromEdgeId(edgeId);
          if (nodes && nodes.length === 2) {
            $(`#${nodes[0]}`).addClass('active');
            $(`#${nodes[1]}`).addClass('active');
          }
        })
        .on('mouseout', (e) => {
          $(e.target).parents('.edge').removeClass('active');
          const edgeId = $(e.target).parents('.edge').attr('id');
          const nodes = getNodeNamesFromEdgeId(edgeId);
          if (nodes && nodes.length === 2) {
            $(`#${nodes[0]}`).removeClass('active');
            $(`#${nodes[1]}`).removeClass('active');
          }
        });

      let $svg = $('svg', this.graphViewContainer);
      if ($svg) {
        $svg.css({
          margin: '0 auto',
          display: 'block',
        });
      }
      if (this.zoomObject) {
        this.graphViewContainer.removeEventListener('wheel', this.zoomObject.zoomWithWheel);
        this.zoomObject.destroy();
      }

      this.zoomObject = Panzoom($svg[0], {
        maxScale: 5,
        animate: true,
      });

      this.graphViewContainer.addEventListener('wheel', this.zoomObject.zoomWithWheel);
    }
  }

  toggle() {
    this.setState({ ...this.state, expanded: !this.state.expanded });
  }

  copyValue(value: string, event: any): void {
    copy(value);

    $(event.target.parentElement).addClass(styles.toolbarItemActive);

    setTimeout(() => {
      $(event.target.parentElement).removeClass(styles.toolbarItemActive);
    }, 800);
  }

  render() {
    const { value, valueFilters, isInJsonMode, isInSqlMode, fieldName } = this.props;

    return (
      <td className={styles.td}>
        {isInJsonMode ? (
          <div>
            <JsonView
              entity={utils.stringToJson(value)}
              onValueClick={this.changeSearchValueFilter.bind(this)}
              valueFilters={valueFilters}
            ></JsonView>
          </div>
        ) : isInSqlMode ? (
          <div>
            <SqlView sql={value}></SqlView>
          </div>
        ) : (
          <div className={styles.expandedContainer}>
            {/* URL类的栏位不需要以HTML方式展示 */}
            {_.includes(utils.SHOULD_SHOW_ORIGIN_CONTENT_FIELDS, fieldName) ? (
              <div
                ref={(container) => {
                  this.container = container;
                }}
                className={`${getFieldClassName(fieldName, value)} ${styles.fieldContextContainer}`}
              >
                <span>{value}</span>
                {_.includes(utils.SHOULD_ADD_LINK_TO_EXPLORE, fieldName) && (
                  <>
                    &nbsp;&nbsp;<span dangerouslySetInnerHTML={{ __html: this.getFileldLink(fieldName, value) }}></span>
                  </>
                )}
              </div>
            ) : (
              <>
                <span
                  ref={(container) => {
                    this.container = container;
                  }}
                  className={`${getFieldClassName(fieldName, value)} ${styles.fieldContextContainer}`}
                  dangerouslySetInnerHTML={{ __html: this.formatField(fieldName, value) }}
                ></span>
                {fieldName === 'fields.requestContext.requestId' && (
                  <>
                    <span
                      className={styles.viewGraphContainer}
                      title="以流向图的方式查看请求链"
                      onClick={this.showGraphView.bind(this, value)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        width="16"
                        height="16"
                        className="link-to-explore-svg"
                      >
                        <path
                          d="M14.3 8.7H9.4c-.18565 0-.3637.07375-.49497.20503C8.77375 9.0363 8.7 9.21435 8.7 9.4v4.9c0 .1857.07375.3637.20503.495.13127.1313.30932.205.49497.205h4.9c.1857 0 .3637-.0737.495-.205.1313-.1313.205-.3093.205-.495V9.4c0-.18565-.0737-.3637-.205-.49497C14.6637 8.77375 14.4857 8.7 14.3 8.7zm-.7 4.9h-3.5v-3.5h3.5v3.5zM6.6 1H1.7c-.18565 0-.3637.07375-.49497.20503C1.07375 1.3363 1 1.51435 1 1.7v4.9c0 .18565.07375.3637.20503.49497C1.3363 7.22625 1.51435 7.3 1.7 7.3h4.9c.18565 0 .3637-.07375.49497-.20503C7.22625 6.9637 7.3 6.78565 7.3 6.6V1.7c0-.18565-.07375-.3637-.20503-.49497C6.9637 1.07375 6.78565 1 6.6 1zm-.7 4.9H2.4V2.4h3.5v3.5zM13.9 6.97633c-.0425-.01764-.0816-.04176-.1155-.07137L12.15 5.40298c-.0573-.06206-.0873-.14189-.0839-.22353.0034-.08165.0399-.1591.1023-.21687.0623-.05777.1458-.09162.2339-.09477.0881-.00316.1742.02461.2412.07776l1.022.94725V3.62201c0-.25811-.1106-.50565-.3075-.68816-.197-.18251-.464-.28505-.7425-.28505H9.35c-.09283 0-.18185-.03417-.24749-.09501C9.03687 2.49295 9 2.41044 9 2.3244c0-.08603.03687-.16855.10251-.22938C9.16815 2.03418 9.25717 2 9.35 2h3.2795c.4641 0 .9092.17089 1.2374.47508.3282.30418.5126.71675.5126 1.14693v2.27081l1.022-.94725c.0325-.03041.0712-.05454.1139-.07101.0426-.01647.0884-.02495.1346-.02495.0462 0 .0919.00848.1346.02495.0426.01647.0814.0406.1139.07101.0324.03031.0581.06626.0755.10579.0174.03952.0263.08184.026.12454-.0004.0851-.0368.16665-.1015.22708L14.278 6.90496c-.033.0307-.0722.05496-.1155.07137-.0842.03156-.1783.03156-.2625 0zM2.1 9.02367c.04254.01764.08158.04176.1155.07137L3.85 10.597c.05734.0621.0873.1419.0839.2236-.0034.0816-.03992.159-.10225.2168-.06233.0578-.14589.0916-.23398.0948-.08808.0031-.17421-.0246-.24117-.0778l-1.022-.9472v2.2708c0 .2581.11063.5056.30754.6882.19691.1825.46399.285.74246.285H6.65c.09283 0 .18185.0342.24749.095.06564.0608.10251.1434.10251.2294s-.03687.1685-.10251.2294c-.06564.0608-.15466.095-.24749.095H3.3705c-.46413 0-.90924-.1709-1.23743-.4751s-.51257-.7167-.51257-1.1469v-2.2708l-1.021995.9472c-.032537.0304-.071247.0546-.113897.071-.042651.0165-.088398.025-.134602.025-.046204 0-.091951-.0085-.134602-.025-.042651-.0164-.081361-.0406-.113898-.071-.032438-.0303-.0581023-.0662-.0755198-.1058-.01741788-.0395-.02624652-.0818-.02597996-.1245.00038671-.0851.03683946-.1667.10149976-.2271L1.722 9.09504c.03298-.0307.07225-.05496.1155-.07137.08419-.03156.17832-.03156.2625 0z"
                          fill="#C7D0D9"
                        ></path>
                      </svg>
                    </span>

                    {this.state.graphViewOpened && (
                      // <Modal
                      //   icon="reusable-panel"
                      //   closeOnEscape={true}
                      //   onClickBackdrop={() => {}}
                      //   onDismiss={this.showGraphView.bind(this, value)}
                      //   title="请求链"
                      //   isOpen={true}
                      // >
                      //   {this.state.isLoadingGraph ? (
                      //     <div style={{ textAlign: 'center' }}>
                      //       <LoadingPlaceholder text="正在加载请求链数据，请稍后..." />
                      //     </div>
                      //   ) : (
                      //     this.state.grahpData.map((o, n) => (
                      //       <div key={n} dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }}></div>
                      //     ))
                      //   )}
                      // </Modal>

                      <Drawer
                        title="请求链"
                        scrollableContent={true}
                        width={'50%'}
                        onClose={this.showGraphView.bind(this, value)}
                      >
                        {this.state.isLoadingGraph ? (
                          <div style={{ textAlign: 'center' }}>
                            <LoadingPlaceholder text="正在加载请求链数据，请稍后..." />
                          </div>
                        ) : (
                          <div
                            ref={(container) => {
                              this.graphViewContainer = container;
                            }}
                            dangerouslySetInnerHTML={{ __html: this.state.svg }}
                          ></div>
                        )}
                      </Drawer>
                    )}
                  </>
                )}
              </>
            )}

            {!_.isNull(value) && !_.isUndefined(value) && value !== '' && (
              <>
                <div className={styles.toolbarContainer}>
                  <div className={styles.toolbarItem}>
                    <Icon name="copy" title="复制内容" onClick={this.copyValue.bind(this, value)}></Icon>
                  </div>
                </div>

                <div
                  ref={(btn) => {
                    this.toggleBtn = btn;
                  }}
                  className={styles.toggleContainer}
                  onClick={this.toggle.bind(this)}
                >
                  {this.state.expanded ? (
                    <>
                      点击收起 <Icon name="angle-up"></Icon>
                    </>
                  ) : (
                    <>
                      点击展开 <Icon name="angle-down"></Icon>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </td>
    );
  }
}
