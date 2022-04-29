import { google } from 'googleapis'
import authKey from '../../f1-fantasy-2022-da81751f791f.json'

const sheets = google.sheets('v4')

// export const getSheetsApi = async () => {
//   const auth = new google.auth.JWT({
//     email: authKey.client_email,
//     keyFile: 'f1-fantasy-2022-da81751f791f.json',
//     key: authKey.private_key,
//     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//   })

//   google.options({ auth })

//   return sheets
// }

export const googleAuth = new google.auth.JWT({
  email: authKey.client_email,
  keyFile: 'f1-fantasy-2022-da81751f791f.json',
  key: authKey.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
