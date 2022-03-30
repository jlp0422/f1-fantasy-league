export const getColumnValues = (columnData) => {
  const values = columnData.data.sheets[0].data[0].rowData?.map(
    (row) => row.values[0].formattedValue
  )
  return values || []
}
