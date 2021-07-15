import React, { ReactElement } from 'react';
import { css } from '@emotion/css';
import { SelectableValue, dateTimeParse } from '@grafana/data';
import { Field, LoadingPlaceholder, Select } from '@grafana/ui';
import { useLocation } from 'react-router-dom';
import { locationSearchToObject } from '@grafana/runtime';

import { PluginList } from '../components/PluginList';
import { SearchField } from '../components/SearchField';
import { HorizontalGroup } from '../components/HorizontalGroup';
import { useHistory } from '../hooks/useHistory';
import { Plugin } from '../types';
import { Page as PluginPage } from '../components/Page';
import { Page } from 'app/core/components/Page/Page';
import { usePluginsByFilter } from '../hooks/usePlugins';
import { useSelector } from 'react-redux';
import { StoreState } from 'app/types/store';
import { getNavModel } from 'app/core/selectors/navModel';

export default function Browse(): ReactElement {
  const location = useLocation();
  const query = locationSearchToObject(location.search);
  const navModel = useSelector((state: StoreState) => getNavModel(state.navIndex, 'plugins'));

  const q = query.q as string;
  const filterBy = (query.filterBy as string) ?? 'installed';
  const sortBy = (query.sortBy as string) ?? 'name';

  const plugins = usePluginsByFilter(q, filterBy);
  const sortedPlugins = plugins.items.sort(sorters[sortBy]);
  const history = useHistory();

  const onSortByChange = (value: SelectableValue<string>) => {
    history.push({ query: { sortBy: value.value } });
  };

  const onFilterByChange = (value: SelectableValue<string>) => {
    history.push({ query: { filterBy: value.value } });
  };

  const onSearch = (q: any) => {
    history.push({ query: { filterBy: 'all', q } });
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <PluginPage>
          <SearchField value={q} onSearch={onSearch} />
          <HorizontalGroup>
            <div>
              {plugins.isLoading ? (
                <LoadingPlaceholder
                  className={css`
                    margin-bottom: 0;
                  `}
                  text="Loading results"
                />
              ) : (
                `${sortedPlugins.length} ${sortedPlugins.length > 1 ? 'results' : 'result'}`
              )}
            </div>
            <Field label="Show">
              <Select
                width={15}
                value={filterBy}
                onChange={onFilterByChange}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'installed', label: 'Installed' },
                ]}
              />
            </Field>
            <Field label="Sort by">
              <Select
                width={20}
                value={sortBy}
                onChange={onSortByChange}
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'popularity', label: 'Popularity' },
                  { value: 'updated', label: 'Updated date' },
                  { value: 'published', label: 'Published date' },
                  { value: 'downloads', label: 'Downloads' },
                ]}
              />
            </Field>
          </HorizontalGroup>

          {!plugins.isLoading && <PluginList plugins={sortedPlugins} />}
        </PluginPage>
      </Page.Contents>
    </Page>
  );
}

const sorters: { [name: string]: (a: Plugin, b: Plugin) => number } = {
  name: (a: Plugin, b: Plugin) => a.name.localeCompare(b.name),
  updated: (a: Plugin, b: Plugin) => dateTimeParse(b.updatedAt).valueOf() - dateTimeParse(a.updatedAt).valueOf(),
  published: (a: Plugin, b: Plugin) => dateTimeParse(b.createdAt).valueOf() - dateTimeParse(a.createdAt).valueOf(),
  downloads: (a: Plugin, b: Plugin) => b.downloads - a.downloads,
  popularity: (a: Plugin, b: Plugin) => b.popularity - a.popularity,
};
