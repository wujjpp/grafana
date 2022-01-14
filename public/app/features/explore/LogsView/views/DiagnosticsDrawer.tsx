/**
 * Created by Wu Jian Ping on - 2021/05/27.
 */

import React from 'react';
import { stylesFactory, Drawer } from '@grafana/ui';
import { css } from 'emotion';
import { Props, DiagnosticsView } from './DiagnosticsView';

const getStyles = stylesFactory(() => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      margin-right: -16px;
    }
    `,

    header: css`
      display: flex;
      -webkit-box-align: center;
      align-items: center;
      position: relative;
      border-bottom: 1px solid #202226;
      border-color: #2c3235;
      padding-left: 16px;
      padding-right: 16px;
      margin-left: -16px;
      margin-right: -16px;
      padding-bottom: 16px;
    `,

    headerTitle: css`
      font-size: 18px;
      margin-bottom: 0;
    `,
  };
});

export default class DiagnosticsDrawer extends React.Component<Props> {
  styles = getStyles();
  render() {
    const { onClose } = this.props;
    return (
      <Drawer width="40%" scrollableContent={false} closeOnMaskClick={true} onClose={onClose}>
        <div className={this.styles.container}>
          <div className={this.styles.header}>
            <h2 className={this.styles.headerTitle}>接口诊断</h2>
          </div>
          <DiagnosticsView {...this.props}></DiagnosticsView>
        </div>
      </Drawer>
    );
  }
}
