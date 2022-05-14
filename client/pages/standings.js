import ConstructorStandingRow from 'components/ConstructorStandingRow'
import Layout from 'components/Layout'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'

const sheets = google.sheets('v4')

const Standings = ({ standings }) => {
  return (
    <Layout pageTitle="Standings" documentTitle="Standings">
      <ol className="w-auto my-4 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        {standings.map(([constructor, points], index) => {
          return (
            <ConstructorStandingRow
              key={constructor}
              points={points}
              constructor={constructor}
            />
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
