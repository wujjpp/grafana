/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import $ from 'jquery';
import utils from '../utils';

const hljs = require('highlight.js/lib/core');
const languageJson = require('highlight.js/lib/languages/json');

hljs.registerLanguage('json', languageJson);
hljs.addPlugin({
  'after:highlightElement': ({ el, result, text }: { el: any; result: any; text: any }) => {
    console.log(text);
  },
});

require('./global.css');

interface Props {
  entity: any;
  onValueClick?: (value: any) => void;
  valueFilters?: string[];
}

export default class JsonView extends React.PureComponent<Props> {
  styles = getStyles();
  codeBlock: HTMLElement | null;

  shouldHighlight(value: any): any {
    const { valueFilters } = this.props;
    let tmp = '';
    if (_.isString(value)) {
      tmp = value;
    } else if (!_.isUndefined(tmp)) {
      tmp = value.toString();
    }
    return _.includes(valueFilters, value);
  }

  componentDidMount() {
    const { onValueClick } = this.props;

    if (onValueClick && this.codeBlock) {
      const $codeBlock = $(this.codeBlock);
      const $eles = $codeBlock.find('.hljs-string');

      for (let i = 0; i < $eles.length; ++i) {
        const $ele = $($eles[i]);
        const originValue = $ele.text();
        const actualVal = utils.trimSemicolon(originValue);
        const shouldHighlight = this.shouldHighlight(actualVal);
        const $btn = $(
          '<div title="在筛选条件添加/移除该值"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="css-sr6nr"><path d="M19,2H5A3,3,0,0,0,2,5V6.17a3,3,0,0,0,.25,1.2l0,.06a2.81,2.81,0,0,0,.59.86L9,14.41V21a1,1,0,0,0,.47.85A1,1,0,0,0,10,22a1,1,0,0,0,.45-.11l4-2A1,1,0,0,0,15,19V14.41l6.12-6.12a2.81,2.81,0,0,0,.59-.86l0-.06A3,3,0,0,0,22,6.17V5A3,3,0,0,0,19,2ZM13.29,13.29A1,1,0,0,0,13,14v4.38l-2,1V14a1,1,0,0,0-.29-.71L5.41,8H18.59ZM20,6H4V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1Z"></path></svg></div>'
        ).addClass(this.styles.iconCell);

        if (shouldHighlight) {
          $btn.addClass(this.styles.iconCellActive);
        }

        $btn.on('click', () => {
          onValueClick(actualVal);
        });

        let $newValElement;
        // if (shouldHighlight) {
        //   $newValElement = $(`<em>${originValue}</em>`);
        // } else {
        //   $newValElement = $(`<span>${originValue}</span>`);
        // }
        $newValElement = $(`<span>${originValue}</span>`);
        $ele.empty().append($newValElement).append($btn);
      }
    }
  }

  render() {
    const { entity } = this.props;

    let obj = _.cloneDeep(entity);

    // request context
    if (_.isString(obj?.fields?.requestContext?.headers)) {
      obj.fields.requestContext.headers = JSON.parse(obj.fields.requestContext.headers);
    }
    if (_.isString(obj?.fields?.requestContext?.query)) {
      obj.fields.requestContext.query = JSON.parse(obj.fields.requestContext.query);
    }
    if (_.isString(obj?.fields?.requestContext?.body)) {
      obj.fields.requestContext.body = JSON.parse(obj.fields.requestContext.body);
    }

    // request info
    if (_.isString(obj?.fields?.requestInfo?.headers)) {
      obj.fields.requestInfo.headers = JSON.parse(obj.fields.requestInfo.headers);
    }
    if (_.isString(obj?.fields?.requestInfo?.query)) {
      obj.fields.requestInfo.query = JSON.parse(obj.fields.requestInfo.query);
    }
    if (_.isString(obj?.fields?.requestInfo?.body)) {
      obj.fields.requestInfo.body = JSON.parse(obj.fields.requestInfo.body);
    }

    return (
      <div className={this.styles.highlightView}>
        <pre>
          <code
            ref={(codeBlock) => {
              this.codeBlock = codeBlock;
            }}
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(JSON.stringify(obj, null, 4), { language: 'json', ignoreIllegals: true }).value,
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
