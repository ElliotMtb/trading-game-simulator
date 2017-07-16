var ViewInitializer = (function() {

	var init = function(kineticLayer) {

		//hexboard

		app.GameBoardHexRadius = 45;
		
		
		app.GameBoardCenterX = 450;
		app.GameBoardCenterY = 350;
		
		var gameBoardBuilder = new app.BoardBuilder.GameBoardBuilder();

		gameBoardBuilder.AssembleBoard(kineticLayer);

		app.Stage.add(kineticLayer);
		kineticLayer.draw();

		// Print out hex-types adjacent to each intersection (in a natural/logical order)
		app.printManMappedLogicalOrderIntersectToHexTypes();
	};
	
	return { init: init };
	
}());