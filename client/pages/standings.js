import { google } from 'googleapis'
import Link from 'next/link'
import { googleAuth } from '../helpers/auth'
import Header from '../components/Header'

const sheets = google.sheets('v4')

function Standings({ standings }) {
  console.log({ standings })
  return (
    <div>
      <Header />
      <h1>2022 Standings</h1>
      <ol>
        {standings.map(([constructor, points]) => {
          return (
            <li key={constructor}>
              <Link
                href={{
                  pathname: '/constructors/[name]',
                  query: { name: encodeURIComponent(constructor) },
                }}
              >
                <a>
                  {constructor}: {points}
                </a>
              </Link>
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
