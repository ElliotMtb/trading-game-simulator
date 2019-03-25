import { SettlersAppPage } from './app.po';
import { browser, element, by } from 'protractor';

// http://blog.ng-book.com/taking-screenshots-with-protractor/
// at the top of the test spec:
var fs = require('fs');
 
//abstract writing screen shot to a file
function writeScreenShot(data, filename) {

  filename += new Date().getTime() + '.png';

  var stream = fs.createWriteStream("e2e/screenshots/" + filename);
  stream.write(new Buffer(data, 'base64'));
  stream.end();
}

describe('settlers-app App', () => {
  let page: SettlersAppPage;

  beforeEach(() => {
    page = new SettlersAppPage();
  });

  // https://stackoverflow.com/a/38964589
  var originalTimeout;

  beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should play 2 player game', () => {
    
    page.navigateTo();

    // Tried to paramaterize these calls in a loop, but didn't work
    page.setPlayerNameInput('pam');
    page.playerNameInputPressEnter();
    page.setPlayerColor(1, 'red');

    page.setPlayerNameInput('angela');
    page.playerNameInputPressEnter();
    page.setPlayerColor(2, 'blue');

    // can't get this to work. perhaps I'm not attaching to the right method
    //expect(function () {page.clickBeginGame()}).toThrow();
        
    page.clickBeginGame();

    browser.takeScreenshot().then(function (png) {
        writeScreenShot(png, '2players');
    });
  });

  it('should play 3 player game', () => {
    
    page.navigateTo();

    // Tried to paramaterize these calls in a loop, but didn't work
    page.setPlayerNameInput('kevin');
    page.playerNameInputPressEnter();
    page.setPlayerColor(1, 'red');

    page.setPlayerNameInput('oscar');
    page.playerNameInputPressEnter();
    page.setPlayerColor(2, 'blue');

    page.setPlayerNameInput('creed');
    page.playerNameInputPressEnter();
    page.setPlayerColor(3, 'green');

    // can't get this to work. perhaps I'm not attaching to the right method
    //expect(function () {page.clickBeginGame()}).toThrow();

    page.clickBeginGame();
    
    browser.takeScreenshot().then(function (png) {
        writeScreenShot(png, '3players');
    });

  });

  var testParams = [];
  var index = 0;
  for (index = 0; index < 1000; index++)
  {
    testParams.push(index);
  }

  testParams.map(function(testSpec) {
    
    it('should play 4 player game', () => {


      page.navigateTo();

      // Tried to paramaterize these calls in a loop, but didn't work
      page.setPlayerNameInput('michael');
      page.playerNameInputPressEnter();
      page.setPlayerColor(1, 'red');

      page.setPlayerNameInput('dwight');
      page.playerNameInputPressEnter();
      page.setPlayerColor(2, 'blue');

      page.setPlayerNameInput('jim');
      page.playerNameInputPressEnter();
      page.setPlayerColor(3, 'green');
      
      page.setPlayerNameInput('andy');
      page.playerNameInputPressEnter();
      page.setPlayerColor(4, 'white');

      // can't get this to work. perhaps I'm not attaching to the right method
      //expect(function () {page.clickBeginGame()}).toThrow();
      
      var winner = 'unknown';

      page.clickBeginGame();

      var winnerText = page.checkForWinner();

      winnerText.then(function(text){
          if (text.includes('Player wins')){
            var pat = /color: (.*) name: (.*) points/
            winner = text.match(pat)[1] + '_' + text.match(pat)[2];
        }
      });

      browser.takeScreenshot().then(function (png) {
          writeScreenShot(png, '4players' + '_' + winner);
      });
  
    });

  });

});
