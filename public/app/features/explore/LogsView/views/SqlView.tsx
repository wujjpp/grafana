/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';

const hljs = require('highlight.js/lib/core');
const languageSql = require('highlight.js/lib/languages/sql');

hljs.registerLanguage('sql', languageSql);
hljs.addPlugin({
  'after:highlightElement': ({ el, result, text }: { el: any; result: any; text: any }) => {
    console.log(text);
  },
});

require('./global.css');

interface Props {
  sql: string;
}

export default class SqlView extends React.PureComponent<Props> {
  styles = getStyles();
  codeBlock: HTMLElement | null;

  render() {
    const { sql } = this.props;

    return (
      <div className={this.styles.highlightView}>
        <pre>
          <code
            ref={(codeBlock) => {
              this.codeBlock = codeBlock;
            }}
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(sql, { language: 'sql', ignoreIllegals: true }).value,
            }}
          ></code>
        </pre>
      </div>
    );
  }
}

const getStyles = stylesFactory(() => {
  return {
    highlightView: css`
      pre {
        border-radius: 0px;
        // background-color: #141619 !important;
        background-color: transparent !important;
        border: 0 !important;
        letter-spacing: 1px;
        font-family: Roboto, Helvetica Neue, Arial, sans-serif !important;
        font-size: 14px !important;
        margin-bottom: 0 !important;
        padding: 0 !important;

        code {
          // letter-spacing: 1px;
          font-family: Roboto, Helvetica Neue, Arial, sans-serif !important;
          font-size: 14px !important;
          margin: 0 !important;
        }
      }
    `,

    iconCell: css`
      width: 28px;
      text-align: center;
      cursor: pointer;
      color: rgb(179, 179, 179);
      display: inline-block;
      // vertical-align: text-top;
      margin-left: 4px;

      :hover {
        color: rgb(255, 255, 255);
      }
    `,

    iconCellActive: css`
      color: rgb(51, 162, 229) !important;
      :hover {
        color: rgb(51, 162, 229) !important;
      }
    `,
  };
});
