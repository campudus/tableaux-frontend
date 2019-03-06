# Tableaux Frontend [![Codacy Badge](https://api.codacy.com/project/badge/Grade/f0d9aa2ca53f415f91d355ed713ae405)](https://www.codacy.com/app/Campudus/tableaux-frontend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=campudus/tableaux-frontend&amp;utm_campaign=Badge_Grade)

Tableaux (pronounced /ta.blo/) is a restful service for storing data
in tables. This project contains an generic React-based HTML5 client
for the [tableaux backend](https://github.com/campudus/tableaux).

## Project setup
Go to project directory and execute:

    npm install

## Run project locally in dev mode
Go to project directory and execute:

    npm run dev

The redux store can hold a lot of data, which can slow down redux
devtools severely. So when you have redux devtools installed and run
into trouble while developing in large tables, you can try running
with

    REDUX_DEVTOOLS=false npm run dev

## Build project with clean before
Go to project directory and execute:

    npm run clean && npm run build

or

    npm run start

## Project configuration
Default project configuration can be overwritten via a `config.json`
in the base directory or via environment variables.

**Example for config.json**

```
{
  "outDir": "out",
  "host": "localhost",
  "apiPort": 8080,     // port of the backend service
  "serverPort": 3000   // port for the http frontend
}
```

**Example for environment variables**

That's very usefull if you for example want to start multiple
instances, what implies that you also have to use different ports.

Following variable names can be used:

- HOST
- APIPORT
- SERVERPORT
- OUTDIR

```
HOST=localhost npm start dev
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
