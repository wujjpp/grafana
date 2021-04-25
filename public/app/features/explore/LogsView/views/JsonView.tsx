/**
 * Created by Wu Jian Ping on - 2021/04/16.
 */

import _ from 'lodash';
import HighlightView, { Languages } from './HighlightView';

const JsonView = ({ entity, filters }: { entity: any; filters?: string[] }): JSX.Element => {
  return HighlightView({ entity, language: Languages.json });
};

JsonView.displayName = 'JsonView';

export default JsonView;
