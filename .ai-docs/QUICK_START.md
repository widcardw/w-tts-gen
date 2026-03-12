# W-TTS 快速开发指南

## Backend Service

Wails V3 https://v3alpha.wails.io/

### Call Go Function from Frontend

For example, we have `services/greetservice.go`

```go
package services

type GreetService struct{}

func (g *GreetService) Greet(name string) string {
	return "Hello " + name + "!"
}
```

Then apply the service in `main.go`

```go
app := application.New(application.Options{
		// ...
		Services: []application.Service{
			application.NewService(&services.GreetService{}), // apply here
		},
		// ...
	})
```

In frontend pages, we do

```ts
import { GreetService } from '#/wails/services'
async function getGreetMsg(name: string) {
  return await GreetService.Greet(name)  // Hello ${name}!
}
```

### Get Application Instance in Go Functions

We often use the app instance to invoke global events.

```go
import "github.com/wailsapp/wails/v3/pkg/application"
// ...
app := application.Get()
app.Event.Emit("progress:edge", ProgressEvent{
  finished: i+1,
  total: len(segments),
})
```

In frontend, we can listen the event and update the progress bar.

```ts
import {Events} from '@wailsio/runtime'
const cleanupEdgeProgressListener = Events.On('progress:edge', (data: {name: string; data: {total: number; finished: number}}) => {
  const {total, finished} = data.data
})
```

### Open URL in default browser

```go
err := app.Browser.OpenURL("https://wails.io")
if err != nil {
    app.Logger.Error("Failed to open URL", "error", err)
}
```

### Adding dialog at backend

> Dialogs in backend or frontend, either is ok.

```go
// Question dialog with button callbacks
dialog := app.Dialog.Question().
    SetTitle("Confirm").
    SetMessage("Delete this file?")

deleteBtn := dialog.AddButton("Delete")
deleteBtn.OnClick(func() {
    deleteFile()
})

cancelBtn := dialog.AddButton("Cancel")
dialog.SetDefaultButton(cancelBtn)
dialog.SetCancelButton(cancelBtn)
dialog.Show()
```

### Using dialog in frontend

> Dialogs in backend or frontend, either is ok.

```ts
import { Dialogs } from '@wailsio/runtime'

const resLabel = await Dialogs.Question({
  Title: 'Are you sure?',
  Buttons: [
    {Label: 'Delete', IsDefault: false, IsCancel: false}, 
    {Label: 'No', IsDefault: true, IsCancel: true}
	],
  Message: 'Are you sure you want to delete it?',
})

if (resLabel === 'Delete') {
  console.log('Delete')
}
```

## Dev

```sh
wails3 dev
```

## Build

```sh
wails3 build
wails3 package
```
