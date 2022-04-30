import { google } from 'googleapis'

// const sheets = google.sheets('v4')

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
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
