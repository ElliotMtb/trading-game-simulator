import { browser, by, element, protractor } from 'protractor';

export class SettlersAppPage {
  navigateTo() {
    return browser.get('/');
  }

  clickBeginGame() {
    element(by.css('a[href="#/begin"')).click();
  }

  checkForWinner() {
   return element(by.css('.spa-shell-foot strong')).getText();
  }

  setPlayerColor(playerNum, color) {
    element.all(by.css('.selectColor[value=' + color + ']')).get(playerNum - 1).click();
  }

  setPlayerNameInput(name) {
    element(by.css('#new-player')).sendKeys(name);
  }

  playerNameInputPressEnter() {
    browser.actions().sendKeys(protractor.Key.ENTER).perform();
  }
}
