var app = app || {};

app.IntersectionBuilder = (function() {

    var _gameBoardController = new app.GameBoardController.Controller();
    var _boardDataManager = new app.Proxies.BoardDataManager();

    function IntersectionBuilder(app) {

        this._idGenerator = app;
        this._utils = app.Utility;
    }

    var IntersectionBuilder_RadialSweep = function(centerX, centerY, hexRadius, idOfCurrentHex) {

        // Get range of 0 to 6
        // ES6 ... 'spread' operator
        var fwdIndices = [...Array(7).keys()];

        // Forward radial vertex-index sweep
        sweep(
            fwdIndices,
            centerX,
            centerY,
            hexRadius,
            idOfCurrentHex,
            this._idGenerator
        );

        // Reverse radial vertex-index sweep
        sweep(
            fwdIndices.reverse(),
            centerX,
            centerY,
            hexRadius,
            idOfCurrentHex,
            this._idGenerator
        );
    };

    function sweep(indicesSeq, centerX, centerY, hexRadius, idOfCurrentHex, idGen) {

        var lastIntersectionInSweep;        

        indicesSeq.forEach(function(radialIndex) {

            var vertexCoords = _boardDataManager.getHexVertexCoords(centerX, centerY, hexRadius, radialIndex);

            lastIntersectionInSweep = updateTheAdjacencies(idGen, idOfCurrentHex, vertexCoords, lastIntersectionInSweep);
        });
    }

    IntersectionBuilder.prototype.RadialSweep = IntersectionBuilder_RadialSweep;

    var updateTheAdjacencies = function(idGen, idOfCurrentHex, vertexCoords, lastIntersectionInSweep) {
        
        var vertexX = vertexCoords[0];
        var vertexY = vertexCoords[1];

        var collisionIndex = _boardDataManager.indexOfExistingIntersection(vertexX, vertexY);

        // No collision
        if (collisionIndex === -1)
        {
            var newIntersectId = idGen.nextIntersectionId();

            _boardDataManager.addIntersection(newIntersectId, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep);
            _gameBoardController.BindIntersectClick(newIntersectId);

            lastIntersectionInSweep = newIntersectId;
        }
        // Collision
        else
        {
            _boardDataManager.updateIntersection(_gameBoardController, idGen, idOfCurrentHex, vertexX, vertexY, collisionIndex, lastIntersectionInSweep);

            lastIntersectionInSweep = collisionIndex;
        }
        
        return lastIntersectionInSweep;
    };
    
    return {
        IntersectionBuilder : IntersectionBuilder
    };

})();