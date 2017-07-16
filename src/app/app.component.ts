import { Component } from '@angular/core';
import { AfterViewInit } from '@angular/core';

declare var app;
declare var ViewInitializer;

// TODO: Add jquery and underscore as managed dependencies
// ...also consider dependencies on KineticJS, Backbone, and Backbone localstorage
declare var _: any;
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';

  //testingtesting
  ngAfterViewInit() {

    app.gameBoardController = new app.GameBoardController.Controller();
    app.controlPanelController = new app.ControlPanelController.Controller();

    app.initModule();

    app.gameBoardController.BindControlPanelButtons();

    // Test that underscore is working
    // this.testingtesting = document.querySelector("#intersect-template").innerHTML;
    // console.log(_.template(this.testingtesting, {id:3}));
  }
}
