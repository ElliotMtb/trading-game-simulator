var app = app || {};

app.IntersectionBuilder = (function() {

    var _gameBoardController = new app.GameBoardController.Controller();
    var _boardDataManager = new app.Proxies.BoardDataManager();

    function IntersectionBuilder(app) {

        this._idGenerator = app;
        this._utils = app.Utility;
    }

    var IntersectionBuilder_RadialSweep = function(centerX, centerY, hexRadius, idOfCurrentHex) {

        var fwdIndices = [...Array(7).keys()];

        // Forward sweep
        sweep(
            fwdIndices,
            centerX,
            centerY,
            hexRadius,
            idOfCurrentHex,
            this._utils, this._idGenerator
        );

        // Reverse sweep
        sweep(
            fwdIndices.reverse(),
            centerX,
            centerY,
            hexRadius,
            idOfCurrentHex,
            this._utils, this._idGenerator
        );
    };

    function sweep(indicesSeq, centerX, centerY, hexRadius, idOfCurrentHex, utils, idGen) {

        var vertexX;
        var vertexY;
        var i;
    
        var xyPair;

        var lastIntersectionInSweep;        

        for (i= 0; i < 7; i++)
        {
            var index = indicesSeq[i];

            xyPair = utils.GetXYatArcEnd(centerX, centerY, hexRadius, (-1*index*2*Math.PI/6) - (-1*2*Math.PI/12));
            vertexX = xyPair[0];
            vertexY = xyPair[1];
        
            lastIntersectionInSweep = updateTheAdjacencies(utils, idGen, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep);
        }
    }

    IntersectionBuilder.prototype.RadialSweep = IntersectionBuilder_RadialSweep;

    var updateTheAdjacencies = function(utils, idGen, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep) {
        
        var collisionIndex = checkForCollision(utils, vertexX,vertexY);

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
     
    var checkForCollision = function (utils, x,y){
        
        // TODO: Use proxy/model to deal with vertices
        for (var i = 0; i < app.vertices.length; i++)
        {
            var intersectionPosition = app.vertices[i].getPosition();
            
            if (utils.Distance(intersectionPosition.x, intersectionPosition.y, x, y) < 2)
            {
                console.log("Collision detected!");
                return i;
            }
        }
    
        return -1;
    };

    return {
        IntersectionBuilder : IntersectionBuilder
    };

})();