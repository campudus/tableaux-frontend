# Tableaux Frontend [![Codacy Badge](https://api.codacy.com/project/badge/Grade/f0d9aa2ca53f415f91d355ed713ae405)](https://www.codacy.com/app/Campudus/tableaux-frontend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=campudus/tableaux-frontend&amp;utm_campaign=Badge_Grade)

Tableaux (pronounced /ta.blo/) is a restful service for storing data in tables. This project contains a generic React-based HTML5 client for the [tableaux backend](https://github.com/campudus/tableaux).

## Project setup
Go to project directory and execute:

    npm install

## Run project locally in dev mode
Go to project directory and execute:

    npm run dev

The redux store can hold a lot of data, which can slow down redux devtools severely. So when you have redux devtools installed and run into trouble while developing in large tables, you can try running
with

    REDUX_DEVTOOLS=false npm run dev

## Build project with clean before
Go to project directory and execute:

    npm run clean && npm run build

## Overview of npm tasks

``` shell
npm run
  start             # create production bundle and serve at serverPort
  build             # create production bundle
  dev               # create dev bundle and serve it at serverPort
  lint              # lint all project source files
  lint:changes      # lint all differences to master
  lint:fix          # apply automated lint fixes to all project source files
  lint:fix:changes  # fix all changes to master
  storybook         # start storybook
  test              # run tests with jest
  clean             # clean build cache and out directory
  clean:project     # clean build cache and out directory, reinstall all dependencies
```

## Project configuration
Default project configuration can be overwritten via a `config.json` in the base directory or via environment variables.

**Example for config.json**

```
{
  "outDir": "out",        // build artefacts go here
  "host": "localhost",    // host of the http frontend
  "port": 3000,           // port for the http frontent
  "apiHost": "localhost", //
  "apiPort": 8080,        // port of the backend service
  "webhookUrl": ".."      // url for Slack webhook to recieve user feedback
}
```

**Example for environment variables**

Environment variables can be used to start multiple instances, listening on multiple ports.

Following variable names can be used:

- HOST
- PORT
- APIHOST
- APIPORT
- OUTDIR
- WEBHOOKURL
- REDUX_DEVTOOLS=[true,false] # "false" disable dev tools integration for dev performance. Default: true
- ENABLE_HISTORY=[true,false] # Show or hide cell history button in cotext menu. Default: true
- SHOW_TABLE_DROPDOWN=[true,false] # Show confusing table settings dropdown. Default: true

```
PORT=3001 npm run start
```

## License

    Copyright 2016-present Campudus GmbH.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
