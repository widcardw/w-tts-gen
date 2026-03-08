import { Dialogs } from '@wailsio/runtime'
import { OsService } from '#/bridgetts/services'

async function chooseTxtFile() {
  const res = Dialogs.OpenFile({
    AllowsMultipleSelection: false,
    Filters: [
      {
        Pattern: '*.txt',
        DisplayName: 'Text Files',
      },
    ],
    ShowHiddenFiles: true,
    CanChooseFiles: true,
    CanChooseDirectories: false,
    CanCreateDirectories: false,
  })

  return res
}

async function chooseAndRead() {
  const res = await chooseTxtFile()
  if (res.length === 0) {
    return ''
  }
  const fileContent = await OsService.ReadTxtFile(res)
  return fileContent
}

export { chooseTxtFile, chooseAndRead }
