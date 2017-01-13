import apiUrl from '../helpers/apiUrl'

const requestChanges = (tableId, colId, data) => {
  const url = apiUrl("/tables/" +
      JSON.stringify(tableId) + "/columns/" +
      JSON.stringify(colId)
  )
  console.log("ColumnHelper.requestChanges: sending", data, "\nto   ", url)
  return new Promise( (resolve, reject) => {
        let request = new XMLHttpRequest()
        request.open('POST', url)
        request.onload = resolve()
        request.onerror = reject("Error posting " + JSON.stringify(data) + " to " + url)
        request.send(JSON.stringify(data))
      }
  )
}

export function changeDisplayName(langtag, tableId, colId, newName) {
  let content = {"displayName": {}}
  content["displayName"][langtag] = newName
  return requestChanges(tableId, colId, content)
}
