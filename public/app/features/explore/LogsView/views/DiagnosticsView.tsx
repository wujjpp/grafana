/**
 * Created by Wu Jian Ping on - 2021/05/27.
 */

import React from 'react';
import _ from 'lodash';
import {
  stylesFactory,
  Drawer,
  Button,
  TabsBar,
  Tab,
  TabContent,
  Field,
  Input,
  CustomScrollbar,
  Alert,
} from '@grafana/ui';
import { css } from 'emotion';
import JsonView from './JsonView';
import axios from 'axios';

interface Props {
  onClose: () => void;
  path: string;
  method?: string;
  headers: any;
  query: any;
  data: any;
}

interface TabConfig {
  label: string;
  active: boolean;
  counter: null;
}

interface State {
  tabs: TabConfig[];
  responseStatus?: any;
  responseHeaders?: any;
  responseBody?: any;
  isRequesting: boolean;
  errorMessage: string;
}

const DEFAULT_HOST = 'http://10.0.4.180:9600';

export default class DiagnosticsView extends React.Component<Props, State> {
  styles = getStyles();

  state: State = {
    tabs: [
      {
        label: 'Request',
        active: true,
        counter: null,
      },
      {
        label: 'Response',
        active: false,
        counter: null,
      },
    ],
    isRequesting: false,
    errorMessage: '',
  };

  setTabActive(index: number): void {
    this.setState({
      ...this.state,
      tabs: _.map(this.state.tabs, (tab, n) => {
        return { ...tab, active: n === index };
      }),
    });
  }

  test() {
    const { path, query, headers } = this.props;

    this.setState({ ...this.state, isRequesting: true });

    console.log(query);

    axios
      .get(`${DEFAULT_HOST}${path}`, { headers: JSON.parse(headers), params: JSON.parse(query) })
      .then((response) => {
        const data = response.data;
        const status = response.status;
        const responseHeaders = response.headers;
        this.setState({
          ...this.state,
          tabs: _.map(this.state.tabs, (tab, n) => {
            return { ...tab, active: n === 1 };
          }),
          responseStatus: status,
          responseHeaders: responseHeaders,
          responseBody: data,
          errorMessage: '',
        });
      })
      .catch((error) => {
        if (error.response) {
          const data = error.response.data;
          const status = error.response.status;
          const responseHeaders = error.response.headers;
          this.setState({
            ...this.state,
            tabs: _.map(this.state.tabs, (tab, n) => {
              return { ...tab, active: n === 1 };
            }),
            responseStatus: status,
            responseHeaders: responseHeaders,
            responseBody: data,
          });
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          this.setState({
            ...this.state,
            tabs: _.map(this.state.tabs, (tab, n) => {
              return { ...tab, active: n === 1 };
            }),
            responseStatus: -1,
            responseHeaders: {},
            responseBody: {},
            errorMessage: 'The request was made but no response was received',
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          this.setState({
            ...this.state,
            tabs: _.map(this.state.tabs, (tab, n) => {
              return { ...tab, active: n === 1 };
            }),
            responseStatus: -1,
            responseHeaders: {},
            responseBody: {},
            errorMessage: error.message,
          });
        }
      })
      .finally(() => {
        this.setState({ ...this.state, isRequesting: false });
      });
  }

  render() {
    const { onClose, path, headers, query, data } = this.props;

    return (
      <Drawer width="40%" scrollableContent={false} closeOnMaskClick={true} onClose={onClose}>
        <div className={this.styles.container}>
          <div className={this.styles.header}>
            <h2 className={this.styles.headerTitle}>接口诊断</h2>
          </div>
          <div className={this.styles.body}>
            <TabsBar>
              {this.state.tabs.map((tab, index) => {
                return (
                  <Tab
                    key={index}
                    label={tab.label}
                    active={tab.active}
                    onChangeTab={this.setTabActive.bind(this, index)}
                  />
                );
              })}
            </TabsBar>
            <CustomScrollbar hideHorizontalTrack={true} hideTracksWhenNotNeeded={true}>
              <div style={{ marginLeft: '-8px', marginRight: '-8px' }}>
                <TabContent>
                  {this.state.tabs[0].active && (
                    <div className={this.styles.formContainer}>
                      <Field label="URL">
                        <Input value={DEFAULT_HOST + path} onChange={() => {}} />
                      </Field>
                      {query && (
                        <Field label="Query">
                          <div className={this.styles.jsonViewContainer}>
                            <JsonView entity={JSON.parse(query)}></JsonView>
                          </div>
                        </Field>
                      )}
                      {data && (
                        <Field label="Data">
                          <div className={this.styles.jsonViewContainer}>
                            <JsonView entity={JSON.parse(data)}></JsonView>
                          </div>
                        </Field>
                      )}
                      {headers && (
                        <Field label="Request Headers">
                          <div className={this.styles.jsonViewContainer}>
                            <JsonView entity={JSON.parse(headers)}></JsonView>
                          </div>
                        </Field>
                      )}
                    </div>
                  )}
                  {this.state.tabs[1].active && (
                    <div className={this.styles.formContainer}>
                      <div className={this.styles.httpStatusContainer}>
                        <span>Http Status Code</span>&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;
                        <span
                          className={
                            this.state.responseStatus === 200 ? this.styles.colorSuccess : this.styles.colorError
                          }
                        >
                          {this.state.responseStatus}
                        </span>
                      </div>

                      <Field label="Response Body">
                        <div className={this.styles.jsonViewContainer}>
                          {this.state.responseBody ? (
                            <JsonView entity={this.state.responseBody}></JsonView>
                          ) : (
                            <span>Empty</span>
                          )}
                        </div>
                      </Field>
                      <Field label="Response Headers">
                        <div className={this.styles.jsonViewContainer}>
                          {this.state.responseHeaders ? (
                            <JsonView entity={this.state.responseHeaders}></JsonView>
                          ) : (
                            <span>Empty</span>
                          )}
                        </div>
                      </Field>

                      {this.state.errorMessage && <Alert title={this.state.errorMessage} severity="error" />}
                    </div>
                  )}
                </TabContent>
              </div>
            </CustomScrollbar>
          </div>
          <div className={this.styles.footer}>
            <Button
              className={this.styles.marginRight16}
              icon={this.state.isRequesting ? 'fa fa-spinner' : 'rocket'}
              onClick={this.test.bind(this)}
              variant={this.state.isRequesting ? 'destructive' : 'primary'}
            >
              测试
            </Button>
            <Button variant="secondary" icon="times" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </Drawer>
    );
  }
}

const getStyles = stylesFactory(() => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      height: 100%;
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

    headerCloseButton: css`
      position: absolute;
      right: 0;
    `,

    body: css`
      flex: 1;
      padding-top: 16px;
      padding-bottom: 16px;
      background-color: #141619;
      padding-left: 16px;
      padding-right: 0;
      margin-left: -16px;
      margin-right: -16px;
      overflow: hidden;
    `,

    formContainer: css`
      padding-right: 16px;
      padding-bottom: 4px;
    `,

    footer: css`
      text-align: right;
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 16px;
      margin-left: -16px;
      margin-right: -16px;
    `,

    marginRight16: css`
      margin-right: 16px;
    `,

    paddingBottom0: css`
      padding-bottom: 0 !important;
    `,

    jsonViewContainer: css`
      background-color: #0b0c0e;
      padding: 8px;
      border: 1px solid #2c3235;
    `,

    httpStatusContainer: css`
      padding-top: 10px;
      padding-bottom: 10px;
    `,

    colorSuccess: css`
      color: green;
      font-weight: 700;
    `,

    colorError: css`
      color: red;
      font-weight: 700;
    `,
  };
});
