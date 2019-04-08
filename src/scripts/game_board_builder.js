var app = app || {};

app.BoardBuilder = (function () {

    
    function GameBoardBuilder() {}

    function GameBoardBuilder_AssembleBoard(kineticLayer, isMinimalViewMode) {

        var radiusToFirstRing = app.GameBoardHexRadius * Math.sqrt(3);
        var i;
        var initialHexId = 1;
        
        // Center hex
        drawRing0(initialHexId, kineticLayer, isMinimalViewMode);
        
        var numHexes = 1;

        drawHexRings(1, 3, initialHexId + numHexes, radiusToFirstRing, kineticLayer, isMinimalViewMode);

        // TODO: It would be more seamless if this was done "inline/in-order" I suppose
        // Add resulting components to the board
        var vertices = app.Proxies.BoardVertices().getAllVertexProxies();

        vertices.map(function(x) {
            kineticLayer.add(x.getVertex());
            kineticLayer.add(x.getVertexText());
        });

        var roadProxies = app.Proxies.RoadManager().getAllRoadProxies();
        roadProxies.map(
            x => kineticLayer.add(x.getRoad())
        );
    }

    var placeNextHex = function(hexId, radiusToRing, angle, kineticLayer, isMinimalViewMode) {

        var arcEndXYPair = app.Utility.GetXYatArcEnd(app.GameBoardCenterX, app.GameBoardCenterY, radiusToRing, angle);

        var arcEndX = arcEndXYPair[0];
        var arcEndY = arcEndXYPair[1];

        var hexBuilder = new app.HexBuilder.HexBuilder();

        // TODO: factor-out/paramaterize global call
        var hexInfo = app.nextHexPiece();
        
        if (hexInfo === null)
            throw "Ran out of hexes";

        if (hexInfo.type === "ocean")
        {
            // Build next hex
            hexBuilder.BuildOceanHex(hexId, hexInfo, arcEndX, arcEndY, kineticLayer);
        }
        else
        {
            var options = {useBackgroundImages: true, showNumPieces: true};

            if (isMinimalViewMode == true)
            {
                options = {useBackgroundImages: false, showNumPieces: false}
            }

            // Build next hex
            hexBuilder.BuildHex(hexId, hexInfo, arcEndX, arcEndY, kineticLayer, options);
        
            // Connect new intersections
            var intersectBuilder = new app.IntersectionBuilder.IntersectionBuilder(app);

            // When placing regular (non-ocean) hexes, need to assemble intersection adjacency info
            intersectBuilder.RadialSweep(arcEndX, arcEndY, app.GameBoardHexRadius, hexId);
        }
    };

    var drawRing0 = function(initialHexId, kineticLayer, isMinimalViewMode) {
    
        var radiusToRing = 0;
        var i = 0;
        var numHexesInRing = 1;

        var hexAngle = -1*i*2*Math.PI/numHexesInRing;
        
        placeNextHex(initialHexId, radiusToRing, hexAngle, kineticLayer, isMinimalViewMode);
    };
    
    var drawHexRings = function(ringStart, numRingsToDraw, hexIdStart, radiusToFirstRing, kineticLayer, isMinimalViewMode) {
        
        var radiusToNthRing;
        var ringHexOffset;
        var angle;

        // -60 degrees
        var primaryAngle = -1*2*Math.PI/6;
        
        var ringNumber = ringStart;

        var x;

        for (x = 0; x < numRingsToDraw; x++)
        {

            var primaryPosition;
            var numHexesInRing = ringNumber * 6;
            var numHexesToPlaceEvery60Deg = ringNumber;

            for (ringHexOffset = 0; ringHexOffset < numHexesInRing; ringHexOffset++)
            {
                primaryPosition = Math.floor(ringHexOffset / numHexesToPlaceEvery60Deg) * primaryAngle;

                // There are n hexes that will be places at
                // each major/primary vector off the center hex i.e. a primary hex is placed in line with each 60 deg vector off
                // the center hex, and then n-1 additional "filler" hexes.
                // (e.g. ring number 3 will have 1 primary hex places and 2 "filler hexes")
                // Every nth hex in the ring (where n = totalNumHexesInRing/6) will utilize the "true" radius for the ring, and every "filler"
                // hex will use a lesser offset radius (thus the center points maintain a linear trajectory rather than an arc).
                var fillerHexOffset = ringHexOffset % numHexesToPlaceEvery60Deg; 

                var aLeg = (numHexesToPlaceEvery60Deg - 0.5 * fillerHexOffset) * radiusToFirstRing;
                var bLeg = (0 + 1.5 * fillerHexOffset) * app.GameBoardHexRadius;

                radiusToNthRing = Math.sqrt(Math.pow(aLeg, 2) + Math.pow(bLeg, 2));

                angle = -1 * Math.atan(bLeg / aLeg) + primaryPosition;

                var hexGuid = ringHexOffset + hexIdStart;

                placeNextHex(hexGuid, radiusToNthRing, angle, kineticLayer, isMinimalViewMode);
            }

            // Update the startId for the next ring
            hexIdStart = hexIdStart + ringHexOffset;
                  
            ringNumber++;
        }

    };
   
    GameBoardBuilder.prototype.AssembleBoard = GameBoardBuilder_AssembleBoard;

    return {
        GameBoardBuilder : GameBoardBuilder
    };

})();