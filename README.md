# Tableaux Frontend [![Codacy Badge](https://api.codacy.com/project/badge/Grade/f0d9aa2ca53f415f91d355ed713ae405)](https://www.codacy.com/app/Campudus/tableaux-frontend?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=campudus/tableaux-frontend&amp;utm_campaign=Badge_Grade)

Tableaux (pronounced /ta.blo/) is a restful service for storing data in tables. This project contains an generic React-based HTML5 client for the [tableaux backend](https://github.com/campudus/tableaux).

## Project setup
Go to project directory and execute:

    npm install

## Run project locally in dev mode
Go to project directory and execute:

    npm run dev

## Build project with clean before
Go to project directory and execute:

    npm run clean && npm run build
    
or

    npm run start
    
    
## Project configuration
Project configuration is done via a `config.json` in the base directory.

```
{
  "outDir" : "out",
  "tableauxUrl" : "http://localhost:8080/"
}
```