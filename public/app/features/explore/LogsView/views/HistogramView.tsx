/**
 * Created by Wu Jian Ping on - 2021/04/25.
 */

import React from 'react';
import {
  AbsoluteTimeRange,
  GraphSeriesXY,
  FieldType,
  MutableDataFrame,
  Field,
  dateTime,
  TimeRange,
} from '@grafana/data';
import { Graph } from '@grafana/ui';
import _ from 'lodash';

interface Props {
  absoluteTimeRange: AbsoluteTimeRange;
  height: number;
  width: number;
  histograms: Array<{ time: number; count: number }>;
  timeStep: number;
  onTimeRangeChanged: (absoluteTimeRange: AbsoluteTimeRange) => void;
}

const HistogramView = (props: Props): JSX.Element => {
  const { absoluteTimeRange, height, width, histograms, timeStep, onTimeRangeChanged } = props;

  // 处理Histograms
  const frame = new MutableDataFrame({
    fields: [
      {
        name: 'time',
        type: FieldType.time,
      },
      {
        name: 'count',
        type: FieldType.number,
      },
    ],
  });

  const graphSeriesXY: GraphSeriesXY = {
    color: '#33a2e5',
    // color: '#73bf69',
    data: [],
    isVisible: true,
    label: '日志量',
    yAxis: {
      index: 0,
      tickDecimals: 0,
    },
    timeField: frame.fields.find((o) => o.name === 'time') as Field,
    valueField: frame.fields.find((o) => o.name === 'count') as Field,
    seriesIndex: 0,
    timeStep: timeStep,
  };

  _.forEach(histograms, (o) => {
    graphSeriesXY.data.push([o.time, o.count]);
    frame.add({ time: o.time, count: o.count });
  });

  // 处理Graph所需的TimeRange
  const timeRange: TimeRange = {
    from: dateTime(absoluteTimeRange.from),
    to: dateTime(absoluteTimeRange.to),
    raw: {
      from: dateTime(absoluteTimeRange.from),
      to: dateTime(absoluteTimeRange.to),
    },
  };

  // 计算BAR宽度
  const maxPoints = Math.ceil((absoluteTimeRange.to - absoluteTimeRange.from) / timeStep);
  let lineWidth = Math.floor(width / maxPoints) - 10;
  if (lineWidth < 0) {
    lineWidth = 1;
  }

  return (
    <Graph
      timeRange={timeRange}
      height={height}
      width={width}
      series={[graphSeriesXY]}
      showLines={false}
      isStacked={false}
      lineWidth={1}
      showBars={true}
      showPoints={false}
      onHorizontalRegionSelected={(from: number, to: number) => {
        onTimeRangeChanged({ from, to });
      }}
    ></Graph>
  );
};

HistogramView.displayName = 'HistogramView';

export default HistogramView;
