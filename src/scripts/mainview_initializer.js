var ViewInitializer = (function() {

    var init = function(kineticLayer, practiceHex, isMinimalViewMode) {

        //hexboard

        app.GameBoardHexRadius = 45;
        app.RoadLength = 20;
        
        app.GameBoardCenterX = 450;
        app.GameBoardCenterY = 350;
        
        var gameBoardBuilder = new app.BoardBuilder.GameBoardBuilder();

        gameBoardBuilder.AssembleBoard(kineticLayer, isMinimalViewMode);

        app.Stage.add(kineticLayer);
        kineticLayer.draw();

        // Print out hex-types adjacent to each intersection (in a natural/logical order)
        app.printManMappedLogicalOrderIntersectToHexTypes();
    };
    
    return { init: init };
    
}());