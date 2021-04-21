/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import React from 'react';
import _ from 'lodash';
import { stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
const SyntaxHighlighter = require('react-syntax-highlighter').default;
const { monokai } = require('react-syntax-highlighter/dist/esm/styles/hljs');

const styles = stylesFactory(() => {
  return {
    jsonView: css`
      pre {
        border-radius: 0px;
        background-color: #141619 !important;
        border: 0 !important;
        letter-spacing: 1px;
        font-family: Roboto, Helvetica Neue, Arial, sans-serif !important;
        font-size: 14px !important;
        margin-bottom: 0 !important;

        code {
          // letter-spacing: 1px;
          font-family: Roboto, Helvetica Neue, Arial, sans-serif !important;
          font-size: 14px !important;
        }
      }
    `,
  };
})();

const JsonView = ({ entity, filters }: { entity: any; filters: string[] }): JSX.Element => {
  entity = _.cloneDeep(entity);

  // request context
  if (_.isString(entity?.fields?.requestContext?.headers)) {
    entity.fields.requestContext.headers = JSON.parse(entity.fields.requestContext.headers);
  }
  if (_.isString(entity?.fields?.requestContext?.query)) {
    entity.fields.requestContext.query = JSON.parse(entity.fields.requestContext.query);
  }
  if (_.isString(entity?.fields?.requestContext?.body)) {
    entity.fields.requestContext.body = JSON.parse(entity.fields.requestContext.body);
  }

  // request info
  if (_.isString(entity?.fields?.requestInfo?.headers)) {
    entity.fields.requestInfo.headers = JSON.parse(entity.fields.requestInfo.headers);
  }
  if (_.isString(entity?.fields?.requestInfo?.query)) {
    entity.fields.requestInfo.query = JSON.parse(entity.fields.requestInfo.query);
  }
  if (_.isString(entity?.fields?.requestInfo?.body)) {
    entity.fields.requestInfo.body = JSON.parse(entity.fields.requestInfo.body);
  }

  return (
    <div className={styles.jsonView}>
      <SyntaxHighlighter language="json" style={monokai}>
        {JSON.stringify(entity, null, 4)}
      </SyntaxHighlighter>
    </div>
  );
};

JsonView.displayName = 'JsonView';

export default JsonView;
