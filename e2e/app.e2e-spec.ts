import { SettlersAppPage } from './app.po';

describe('settlers-app App', () => {
  let page: SettlersAppPage;

  beforeEach(() => {
    page = new SettlersAppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
