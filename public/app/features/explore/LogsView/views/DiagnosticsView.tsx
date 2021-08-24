/**
 * Created by Wu Jian Ping on - 2021/05/27.
 */

import React from 'react';
import { map, forEach } from 'lodash';
import { stylesFactory, Drawer, Button, TabsBar, Tab, TabContent, Field, CustomScrollbar, Alert } from '@grafana/ui';
import { css } from 'emotion';
import JsonView from './JsonView';
import axios from 'axios';

const _ = { map, forEach };

interface Props {
  onClose: () => void;
  path: string;
  method: string;
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
  responseTime: number;
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
    responseTime: 0,
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
    const { path, method, query, headers, data } = this.props;

    const filteredHeader = JSON.parse(headers || {});

    _.forEach(['user-agent', 'host', 'connection', 'content-length', 'content-type'], (key) => {
      delete filteredHeader[key];
    });

    this.setState({ ...this.state, isRequesting: true });

    let m = (method || 'GET').toUpperCase();

    let start = new Date().getTime();
    let end = new Date().getTime();
    Promise.resolve()
      .then(() => {
        return m === 'GET'
          ? axios.get(`${DEFAULT_HOST}${path}`, { headers: filteredHeader, params: JSON.parse(query || {}) })
          : axios.post(`${DEFAULT_HOST}${path}`, JSON.parse(data || '{}'), {
              headers: filteredHeader,
              params: JSON.parse(query || '{}'),
            });
      })
      .then((response) => {
        end = new Date().getTime();
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
        end = new Date().getTime();
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
        this.setState({ ...this.state, isRequesting: false, responseTime: end - start });
      });
  }

  render() {
    const { onClose, path, headers, query, data, method } = this.props;

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
                      <div className={this.styles.fieldContainer}>
                        <span>Url</span>&nbsp;:&nbsp;&nbsp;
                        <span className={this.styles.colorNormal}>{DEFAULT_HOST + path}</span>
                      </div>

                      <div className={`${this.styles.fieldContainer} ${this.styles.paddingTop0}`}>
                        <span>Method</span>&nbsp;:&nbsp;&nbsp;
                        <span className={this.styles.colorNormal}>{(method || '').toUpperCase()}</span>
                      </div>

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
                      <div className={this.styles.fieldContainer}>
                        <span>Http Status Code</span>&nbsp;:&nbsp;&nbsp;
                        <span
                          className={
                            this.state.responseStatus === 200 ? this.styles.colorSuccess : this.styles.colorError
                          }
                        >
                          {this.state.responseStatus}
                        </span>
                      </div>

                      <div className={`${this.styles.fieldContainer} ${this.styles.paddingTop0}`}>
                        <span>Response Time</span>&nbsp;:&nbsp;&nbsp;
                        <span
                          className={this.state.responseTime <= 200 ? this.styles.colorSuccess : this.styles.colorError}
                        >{`${this.state.responseTime} ms`}</span>
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
      padding: 6px;
      border: 1px solid #2c3235;
      position: relative;
    `,

    fieldContainer: css`
      padding-top: 10px;
      padding-bottom: 10px;
      font-size: 12px;
      padding-left: 2px;
      color: #9fa7b3;
    `,

    colorNormal: css`
      color: rgb(199, 208, 217);
    `,

    colorSuccess: css`
      color: green;
      font-weight: 700;
    `,

    colorError: css`
      color: red;
      font-weight: 700;
    `,

    paddingTop0: css`
      padding-top: 0;
    `,

    toolbarContainer: css`
      position: absolute;
      right: 8px;
      top: 8px;
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
  };
});
