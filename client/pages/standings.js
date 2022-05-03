import { google } from 'googleapis'
import Link from 'next/link'
import Header from '../components/Header'
import { googleAuth } from '../helpers/auth'

const sheets = google.sheets('v4')

function Standings({ standings }) {
  console.log({ standings })
  return (
    <div>
      <Header />
      <h1 className="my-2 mx-2 sm:mx-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
        2022 Standings
      </h1>
      <ol className="sm:mx-8 mx-4 my-4 w-auto text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        {standings.map(([constructor, points], index) => {
          return (
            <li
              key={constructor}
              className="w-full px-4 py-2.5 border-b border-gray-200 dark:border-gray-600 first-of-type:rounded-t-lg last-of-type:rounded-b-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{index + 1}.</div>
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    className="w-12 h-12 rounded-full"
                    src="https://www.fillmurray.com/g/300/300"
                    alt={`${constructor} team car`}
                  />
                  <p className="ml-2 text-lg font-medium text-gray-900 truncate dark:text-white">
                    <Link
                      href={{
                        pathname: '/constructors/[name]',
                        query: { name: encodeURIComponent(constructor) },
                      }}
                    >
                      <a className="dark:hover:text-gray-300">{constructor}</a>
                    </Link>
                  </p>
                </div>
                <div className="inline-flex text-lg items-center font-semibold text-gray-900 dark:text-white">
                  {points}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export async function getServerSideProps(context) {
  google.options({ auth: googleAuth })

  const existingColumnData = await sheets.spreadsheets.get({
    ranges: ["'STANDINGS'!A2:B9"],
    spreadsheetId: process.env.SPREADSHEET_ID,
    includeGridData: true,
  })

  return {
    props: {
      standings: existingColumnData.data.sheets[0].data[0].rowData?.map((row) =>
        row.values.map((rowValue) => rowValue.formattedValue)
      ),
    },
  }
}

export default Standings
