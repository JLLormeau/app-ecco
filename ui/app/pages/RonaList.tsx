import React, { useState, useMemo } from 'react';
import { Flex, TitleBar } from '@dynatrace/strato-components/layouts';
import { ProgressCircle } from '@dynatrace/strato-components/content';
import { DataTable } from '@dynatrace/strato-components/tables';
import Colors from '@dynatrace/strato-design-tokens/colors';
import { Select, ToggleButtonGroup } from '@dynatrace/strato-components/forms';
import { Text } from '@dynatrace/strato-components/typography';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { DIVISION_LIST_QUERY, getCpuUsageQuery, type TimePeriod } from '../queries';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '2h',   label: 'Last 2h' },
  { value: 'today', label: 'Today' },
  { value: '7d',   label: 'Last 7 days' },
];

export const RonaList = () => {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('2h');

  const RonaListResult = useDql({ query: DIVISION_LIST_QUERY });

  const divisionname = useMemo(() => {
    if (!RonaListResult.data?.records) return [];
    return RonaListResult.data.records
      .map((r) => r['ronadivisionname'] as string)
      .filter(Boolean);
  }, [RonaListResult.data]);


  const cpuQuery = useMemo(
    () => getCpuUsageQuery(selectedDivision, timePeriod),
    [selectedDivision, timePeriod],
  );

  const result = useDql({ query: cpuQuery });

  const columns = useMemo(
    () => [
      { id: 'ronasitename',       header: 'Site',               accessor: 'ronasitename',       sortType: 'text' as const },
      { id: 'appel_decroche',     header: 'Appel décroché',     accessor: 'appel_decroche',     sortType: 'number' as const },
      { id: 'rona_immediat',      header: 'RONA immédiat',      accessor: 'rona_immediat',      sortType: 'number' as const },
      { id: 'rona_intermediaire', header: 'RONA intermédiaire', accessor: 'rona_intermediaire', sortType: 'number' as const },
      {
        id: 'rona_long',
        header: 'RONA long',
        accessor: 'rona_long',
        sortType: 'number' as const,
        thresholds: [
          {
            comparator: 'greater-than' as const,
            value: 3,
            color: Colors.Text.Critical.Default,
          },
        ],
      },
    ],
    [],
  );

  return (
    <Flex width="100%" flexDirection="column" gap={16}>
      <TitleBar>
        <TitleBar.Title>Rona Insights</TitleBar.Title>
      </TitleBar>

      <Flex flexDirection="row" alignItems="flex-end" gap={16} flexWrap="wrap">
        <Flex flexDirection="column" gap={4} style={{ minWidth: 280 }}>
          <Text textStyle="small-emphasized">Division
          </Text>
          <Select
            value={selectedDivision}
            onChange={(value) => setSelectedDivision(value as string | null)}
            clearable
          >
            <Select.Content>
              <Select.Filter />
              {divisionname.map((name) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ))}
            </Select.Content>
          </Select>
        </Flex>

        {/* Time period toggle */}
        <Flex flexDirection="column" gap={4}>
          <Text textStyle="small-emphasized">Period</Text>
          <ToggleButtonGroup
            value={timePeriod}
            onChange={(value) => setTimePeriod(value as TimePeriod)}
          >
            {TIME_PERIODS.map(({ value, label }) => (
              <ToggleButtonGroup.Item key={value} value={value}>
                {label}
              </ToggleButtonGroup.Item>
            ))}
          </ToggleButtonGroup>
        </Flex>
      </Flex>

      {result.isLoading && <ProgressCircle />}
      {result.data && (
        <DataTable
          data={result.data.records}
          columns={columns}
          sortable
          fullWidth
        >
          <DataTable.Pagination />
        </DataTable>
      )}
    </Flex>
  );
};
