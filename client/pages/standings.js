import ConstructorStandingRow from 'components/ConstructorStandingRow'
import Layout from 'components/Layout'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'

const sheets = google.sheets('v4')

const Standings = ({ standings }) => {
  return (
    <Layout
      documentTitle="Standings"
      description="Overall season standings for all Constructors"
      fullWidth
    >
      <ol className="w-auto mb-4 text-lg font-medium text-white">
        {standings.map(([constructor, principal, points], index) => {
          return (
            <ConstructorStandingRow
              key={constructor}
              principal={principal}
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
    ranges: ["'STANDINGS'!A2:C9"],
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
