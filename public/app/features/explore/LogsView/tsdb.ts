/**
 * Created by Wu Jian Ping on - 2021/04/23.
 */

import axios from 'axios';
import { keys, map, forEach, isString, isArray } from 'lodash';
import { MutableDataFrame, FieldType } from '@grafana/data';
import { Table } from 'apache-arrow';

const _ = { keys, map, forEach, isString, isArray };

// 这边先采用这种方式，后续通过查看源码获取正确方式
const base64StringToArrowTable = (text: string): Table => {
  const b64 = atob(text);
  const arr = Uint8Array.from(b64, (c) => {
    return c.charCodeAt(0);
  });
  return Table.from(arr);
};

const moment = require('moment');

class TSDB {
  async query(options: any): Promise<Array<Record<string, any>>> {
    let response = await axios.post('/api/tsdb/query', options);
    const keys = _.keys(response.data.results);

    return _.map(keys, (key) => {
      if (response?.data?.results[key]?.dataframes?.length > 0) {
        const table = base64StringToArrowTable(response.data.results[key].dataframes[0]);
        const fields = _.map(table.schema.fields, (o) => o.name);
        const list = table.toArray();
        const results = [];
        for (let i = 0; i < list.length; ++i) {
          const row = list[i];
          const o: any = {};
          _.forEach(fields, (f) => {
            o[f] = row.get(f);
          });
          results.push(o);
        }
        return results;
      }
      return [];
    });
  }

  async getHistograms(
    dataSourceId: number,
    from: number,
    to: number,
    queryText: string
  ): Promise<{ histograms: Array<{ time: number; count: number }>; timeStep: number }> {
    // 去掉 "|" 之后的SQL语句
    let query = queryText;

    if (_.isString(query)) {
      if (query.indexOf('|') !== -1) {
        query = queryText.substring(0, queryText.indexOf('|'));
      }

      const requestData: any = {
        Queries: [
          {
            queryType: 'histograms',
            target: 'query',
            refId: 'A',
            datasourceId: dataSourceId,
            queryText: query,
            hide: false,
          },
        ],
      };

      requestData.From = moment(from).valueOf().toString();
      requestData.To = moment(to).valueOf().toString();

      const results = await this.query(requestData);

      if (results.length > 0) {
        let timeStep = 1;

        const histograms = _.map(results[0], (o) => {
          return {
            time: +o.to,
            count: +o.count,
          };
        });

        // 从第二个数据点计算timestep
        if (results.length > 0 && results[0].length >= 3) {
          timeStep = +results[0][1].to - +results[0][1].from;
        }

        return {
          timeStep,
          histograms,
        };
      }
    }

    return { histograms: [], timeStep: 1 };
  }

  async getDistributionByFieldName(
    dataSourceId: number,
    queryText: string,
    fieldName: string,
    from: number,
    to: number
  ): Promise<Array<{ label: string; count: number }>> {
    let query = queryText;
    if (queryText.indexOf('|') !== -1) {
      query = query.substring(0, queryText.indexOf('|'));
    }

    query = `${query} | select "${fieldName}" as label, count(1) as count group by label limit 10000`;

    const requestData: any = {
      Queries: [
        {
          queryType: 'query',
          target: 'query',
          refId: 'A',
          datasourceId: dataSourceId,
          queryText: query,
          hide: false,
        },
      ],
    };

    requestData.From = moment(from).valueOf().toString();
    requestData.To = moment(to).valueOf().toString();

    const list = await this.query(requestData);

    if (_.isArray(list) && list.length > 0) {
      return _.map(list[0], (o: any) => {
        return {
          label: o.label,
          count: +o.count,
        };
      });
    }

    return [];
  }

  async getTotalRecord(dataSourceId: number, from: number, to: number, queryText: string): Promise<number> {
    // 去掉 "|" 之后的SQL语句
    let query = queryText;

    if (_.isString(query)) {
      if (query.indexOf('|') !== -1) {
        query = queryText.substring(0, queryText.indexOf('|'));
      }

      query += ' | select count(1) as count';

      const requestData: any = {
        Queries: [
          {
            queryType: 'query',
            target: 'query',
            refId: 'A',
            datasourceId: dataSourceId,
            queryText: query,
            hide: false,
          },
        ],
      };

      requestData.From = moment(from).valueOf().toString();
      requestData.To = moment(to).valueOf().toString();

      const results = await this.query(requestData);

      if (results.length > 0) {
        return +results[0][0]['count'] || 0;
      }
    }
    return 0;
  }

  async loadPagedData(
    dataSourceId: number,
    from: number,
    to: number,
    queryText: string,
    offset: number,
    maxLineNum: number
  ): Promise<MutableDataFrame> {
    // 去掉 "|" 之后的SQL语句
    let query = queryText;
    const refId = 'A';

    if (_.isString(query)) {
      if (query.indexOf('|') !== -1) {
        query = queryText.substring(0, queryText.indexOf('|'));
      }

      const requestData: any = {
        Queries: [
          {
            queryType: 'query',
            target: 'query',
            refId,
            datasourceId: dataSourceId,
            queryText: query,
            offset,
            maxLineNum,
            hide: false,
          },
        ],
      };

      requestData.From = moment(from).valueOf().toString();
      requestData.To = moment(to).valueOf().toString();

      let response = await axios.post('/api/tsdb/query', requestData);

      if (response?.data?.results[refId]?.dataframes?.length > 0) {
        const table = base64StringToArrowTable(response.data.results[refId].dataframes[0]);
        const fields = _.map(table.schema.fields, (o) => o.name);
        const list = table.toArray();

        const frame = new MutableDataFrame({
          refId,
          fields: _.map(fields, (propertyName) => {
            const field: any = {
              name: propertyName,
              type: FieldType.string,
            };
            return field;
          }),
        });

        for (let i = 0; i < list.length; ++i) {
          const row = list[i];
          const o: any = {};
          _.forEach(fields, (f) => {
            o[f] = row.get(f);
          });
          frame.add(o);
        }
        return frame;
      }
    }

    // return empty frame
    return this.getEmptyDataFrame();
  }

  getEmptyDataFrame(): MutableDataFrame {
    return new MutableDataFrame({
      refId: 'A',
      fields: [],
    });
  }
}

export default new TSDB();
