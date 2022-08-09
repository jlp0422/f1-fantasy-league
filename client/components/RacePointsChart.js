import TickXAxis from 'components/charts/TickXAxis'
import TickYAxis from 'components/charts/TickYAxis'
import CheckboxEmpty from 'components/icons/CheckboxEmpty'
import CheckboxFilled from 'components/icons/CheckboxFilled'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { normalizeConstructorName } from 'helpers/cars'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const RacePointsChart = ({
  setIsChartDropdownOpen,
  selectedChartConstructors,
  isChartDropdownOpen,
  setSelectedChartConstructors,
  cumulativePointsByConstructor,
  constructors,
  chartLines,
}) => {
  const updateSelectedConstructors = (constructor) => {
    if (selectedChartConstructors.includes(constructor)) {
      setSelectedChartConstructors((existing) =>
        existing.filter((c) => c !== constructor)
      )
    } else {
      setSelectedChartConstructors((existing) => existing.concat(constructor))
    }
    setIsChartDropdownOpen(false)
  }

  const dropdownDisplay = () => {
    const length = selectedChartConstructors.length
    if (length > 0) {
      if (length > 3) {
        const extra = length - 3
        return `${selectedChartConstructors.slice(0, 3).join(', ')} (+${extra})`
      }
      return selectedChartConstructors.join(', ')
    }
    return 'All'
  }
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-gray-900 font-secondary md:text-2xl lg:text-3xl">
        Cumulative Points by Race
      </h2>
      <div className="relative font-tertiary">
        <button
          onClick={() => setIsChartDropdownOpen((open) => !open)}
          id="dropdownDefault"
          data-dropdown-toggle="dropdown"
          className="text-white mt-2 my-4 font-medium rounded-lg text-xl px-4 py-2.5 text-center inline-flex items-center bg-gray-600 hover:bg-gray-700"
          type="button"
        >
          {dropdownDisplay()}
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
        {isChartDropdownOpen && (
          <div
            id="dropdown"
            className={`z-10 ${
              isChartDropdownOpen ? 'block' : 'hidden'
            } divide-y divide-gray-100 rounded shadow w-fit bg-gray-500 absolute top-[58px] left-2`}
          >
            <ul
              className="py-1 mt-2 text-xl text-gray-200"
              aria-labelledby="dropdownDefault"
            >
              <li>
                <button
                  onClick={() => {
                    setSelectedChartConstructors([])
                    setIsChartDropdownOpen(false)
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-600 hover:text-white"
                >
                  All
                </button>
              </li>
              {constructors.map((constructor) => {
                const Icon = selectedChartConstructors.includes(
                  constructor.name
                )
                  ? CheckboxFilled
                  : CheckboxEmpty
                return (
                  <li key={constructor.name}>
                    <button
                      onClick={() => {
                        updateSelectedConstructors(constructor.name)
                      }}
                      className="flex w-full gap-1 px-4 py-2 text-left hover:bg-gray-600 hover:text-white"
                    >
                      <Icon />
                      {constructor.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="w-full rounded-lg bg-slate-600 h-500">
        <ResponsiveContainer>
          <LineChart
            data={cumulativePointsByConstructor}
            margin={{ top: 30, right: 30, bottom: 30, left: 10 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="4 4" />
            <XAxis
              dataKey="race"
              padding={{ left: 10, right: 0 }}
              tick={<TickXAxis />}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <YAxis
              tick={<TickYAxis />}
              axisLine={{ stroke: '#ccc' }}
              tickLine={{ stroke: '#ccc' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#475569',
                color: '#fff',
                fontFamily: 'Teko',
                fontSize: '20px',
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '50px',
                fontFamily: 'Teko',
                fontSize: '24px',
              }}
            />
            {chartLines.map((constructor) => {
              const normalized = normalizeConstructorName(constructor)
              const { primary } = COLORS_BY_CONSTRUCTOR[normalized]
              return (
                <Line
                  key={constructor}
                  type="monotone"
                  dataKey={constructor}
                  stroke={primary}
                  strokeWidth={3}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RacePointsChart
