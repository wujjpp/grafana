/**
 * Created by Wu Jian Ping on - 2021/04/22.
 */

import React from 'react';
import { Icon, stylesFactory } from '@grafana/ui';
import { css } from 'emotion';
import _ from 'lodash';
import HighlightView, { Languages } from './HighlightView';
import utils from '../utils';

const styles = stylesFactory(() => {
  return {
    td: css`
      word-wrap: break-word;
      padding: 6px;
      border: 0 !important;
      line-height: 1.5;
      position: relative;
    `,
    toolbar: css`
      position: absolute;
      right: 6px;
      bottom: 6px;
      cursor: pointer;
      color: rgb(51, 162, 229);
      :hover {
        // color: rgb(255, 255, 255);
        color: rgb(51, 162, 229);
      }
    `,

    toolbarActive: css`
      color: rgb(51, 162, 229);
      :hover {
        color: rgb(51, 162, 229) !important;
      }
    `,

    highlight: css`
      background-color: yellow;
      color: #000;
      padding-left: 2px;
      padding-right: 2px;
    `,
  };
})();

interface Props {
  value: any;
  highlight: boolean;
}

interface State {
  showToolbar: boolean;
  isInJsonMode: boolean;
}

export default class FieldView extends React.PureComponent<Props, State> {
  state: State = {
    showToolbar: false,
    isInJsonMode: false,
  };

  // 格式化内容，遇到"回车"换成<br />
  formatField(v: string) {
    if (_.isString(v) && v.indexOf('\n') !== 0) {
      v = v.replace(/\n/gi, '<br />');
    }
    return v;
  }

  toggle(value: any) {
    if (!this.state.isInJsonMode) {
      try {
        utils.stringToJson(value);
        this.setState({ ...this.state, isInJsonMode: true });
      } catch {}
    } else {
      this.setState({ ...this.state, isInJsonMode: false });
    }
  }

  mouseEnter() {
    this.setState({ ...this.state, showToolbar: true });
  }

  mouseLeave() {
    this.setState({ ...this.state, showToolbar: false });
  }

  render() {
    const { value } = this.props;

    return (
      <td className={styles.td} onMouseEnter={this.mouseEnter.bind(this)} onMouseLeave={this.mouseLeave.bind(this)}>
        {this.state.showToolbar || this.state.isInJsonMode ? (
          <div className={`${styles.toolbar} ${this.state.isInJsonMode ? styles.toolbarActive : ''}`}>
            <Icon name="brackets-curly" onClick={this.toggle.bind(this, value)} title="View as JSON"></Icon>
          </div>
        ) : (
          <></>
        )}
        {this.state.isInJsonMode ? (
          <div>{HighlightView({ entity: utils.stringToJson(value), language: Languages.json })}</div>
        ) : (
          <div>
            <span
              className={this.props.highlight ? styles.highlight : ''}
              dangerouslySetInnerHTML={{ __html: this.formatField(value) }}
            ></span>
          </div>
        )}
      </td>
    );
  }
}
