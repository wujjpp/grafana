/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';

const styles = stylesFactory(() => {
  return {
    statusBar: css`
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 40px;
      border-left: 2px solid rgb(142, 142, 142);
    `,

    statusTrace: css`
      border-left-color: rgb(110, 208, 224);
    `,

    statusDebug: css`
      // background-color: rgb(31, 120, 193);
      border-left-color: blue;
    `,

    statusInfo: css`
      // background-color: rgb(126, 178, 109);
      border-left-color: green;
    `,

    statusWarn: css`
      // background-color: rgb(236, 187, 19);
      border-left-color: yellow;
    `,

    statusError: css`
      // background-color: rgb(242, 73, 92);
      border-left-color: red;
    `,

    statusFatal: css`
      border-left-color: purple;
    `,
  };
})();

const StatusBar = (status: string): JSX.Element => {
  return (
    <div
      className={`${styles.statusBar} ${status === 'TRACE' ? styles.statusTrace : ''} ${
        status === 'DEBUG' ? styles.statusDebug : ''
      } ${status === 'INFO' ? styles.statusInfo : ''} ${status === 'WARN' ? styles.statusWarn : ''} ${
        status === 'ERROR' ? styles.statusError : ''
      } ${status === 'FATAL' ? styles.statusFatal : ''}`}
      title={status}
    ></div>
  );
};

StatusBar.displayName = 'StatusBar';

export default StatusBar;
