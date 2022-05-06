import { google } from 'googleapis'
import Link from 'next/link'
import Layout from 'components/Layout'
import { googleAuth } from 'helpers/auth'

const sheets = google.sheets('v4')

const Standings = ({ standings }) => {
  // console.log({ standings })
  return (
    <Layout pageTitle="Standings" documentTitle="Standings">
      <ol className="w-auto my-4 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        {standings.map(([constructor, points], index) => {
          return (
            <li
              key={constructor}
              className="w-full px-4 py-2.5 border-b border-gray-200 dark:border-gray-600 first-of-type:rounded-t-lg last-of-type:rounded-b-lg  odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-700"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 text-base sm:text-lg">
                  {index + 1}.
                </div>
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    className="w-8 h-8 rounded-full sm:w-12 sm:h-12"
                    src="https://www.fillmurray.com/g/300/300"
                    alt={`${constructor} team car`}
                  />
                  <p className="ml-2 text-base font-medium text-gray-900 truncate sm:text-lg dark:text-white">
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
                <div className="inline-flex items-center text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                  {points} points
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Layout>
  )
}

export async function getStaticProps(context) {
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
