# SettlersApp

This project was originally generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.2.1.
It has since been updated as of Dec. 2024 and confirmed to run with:

ng --version

Angular CLI: 13.3.11
Node: 22.12.0 (Unsupported)
Package Manager: npm 10.9.0
OS: linux x64

It ran successfully in these browsers at the time of checking:
-Microsoft Edge
-Firefox

## Build
sudo apt install node
sudo apt install nvm
  - nvm can help switching between using different node versions

npm install -g @angular/cli

npm install

Run `ng prebuild` to transform scripts via babel so ES6 syntax can be used (this might not be necessary in 2024, but the project still expects this transpiling step as of now.)

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Clean
rm -rf node_modules package-lock.json
npm install

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.


## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Configuration
There's a "minimal view" which I used for making the background simple for when I captured a ton of screenshots of ai-played games.
It can be configured inside settlers_spa.js (the main entry point for the single page app) inside the initModule function
```var minimalViewMode = false;```

The game can be played through completely as AI players only (after setting up the players and starting the game).
To play AI only:
isAiOnlyGame = true; (in game_board_controller.js as a temporary solution until better config can be offered)
