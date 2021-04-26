/**
 * Created by Wu Jian Ping on - 2021/04/23.
 */

import axios from 'axios';
import _ from 'lodash';
import { base64StringToArrowTable } from '@grafana/data';

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

    query = `${query} | select "${fieldName}" as label, count(1) as count group by label`;

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
}

export default new TSDB();
