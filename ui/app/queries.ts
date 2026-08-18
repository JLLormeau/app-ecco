export const DIVISION_LIST_QUERY = `timeseries { sum(logs.ecco_rona_count) }, by: { ronadivisionname }
| fields ronadivisionname
| dedup ronadivisionname`;

export type TimePeriod = '2h' | 'today' | '7d';

function getFromClause(timePeriod: TimePeriod): string {
  if (timePeriod === 'today') {
    // Compute local midnight as an absolute UTC timestamp so DQL
    // starts exactly at 00:00 in the user's timezone (not UTC midnight).
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return `from: "${startOfToday.toISOString()}"`;
  }
  const map: Record<Exclude<TimePeriod, 'today'>, string> = {
    '2h': 'from: -2h',
    '7d': 'from: -7d',
  };
  return map[timePeriod];
}

export const getCpuUsageQuery = (
  Division_metier?: string | null,
  timePeriod: TimePeriod = '2h',
) => {
  const fromClause = getFromClause(timePeriod);
  const filterClause = Division_metier
    ? `, filter: { matchesValue(ronadivisionname, "${Division_metier}") }`
    : '';
  return `timeseries { sum(logs.ecco_rona_count), value = sum(logs.ecco_rona_count, scalar: true, default:0), nonempty:true },
by: { call_type, ronasitename }${filterClause}, ${fromClause}
| fieldsAdd call_type=if(isNull(call_type),"NA", else: call_type)
| sort ronasitename
| summarize {
    appel_decroche = takeAny(if(call_type == "appel_decroche", value)),
    rona_immediat = takeAny(if(call_type == "rona_immediat", value)),
    rona_intermediaire = takeAny(if(call_type == "rona_intermediaire",  value)),
    rona_long = takeAny(if(call_type == "rona_long",  value))
  },
  by:{ronasitename}
  | fields ronasitename, appel_decroche=coalesce(appel_decroche,0), rona_intermediaire=coalesce(rona_intermediaire, 0), rona_immediat=coalesce(rona_immediat, 0), rona_long=coalesce(rona_long, 0)
`;
};
