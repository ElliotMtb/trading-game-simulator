var app = app || {};

app.IntersectionBuilder = (function() {

    var gameBoardController = new app.GameBoardController.Controller();

    function IntersectionBuilder(app) {

        this._idGenerator = app;
        this._utils = app.Utility;
    }

    var IntersectionBuilder_RadialSweep = function(centerX, centerY, hexRadius, idOfCurrentHex) {
        
        var vertexX;
        var vertexY;
        var i;
    
        var xyPair;

        var lastIntersectionInSweep;
        
        // Forward sweep
        for (i= 0; i < 7; i++)
        {
            xyPair = this._utils.GetXYatArcEnd(centerX, centerY, hexRadius, (-1*i*2*Math.PI/6) - (-1*2*Math.PI/12));
            vertexX = xyPair[0];
            vertexY = xyPair[1];
        
            lastIntersectionInSweep = updateTheAdjacencies(this._utils, this._idGenerator, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep);
        }
        
        // Reverse sweep (makes sure to get all the vertices adjacencies on the boundaries of the game board)
        for (i= 6; i >= 0; i--)
        {
            xyPair = this._utils.GetXYatArcEnd(centerX, centerY, hexRadius, (-1*i*2*Math.PI/6) - (-1*2*Math.PI/12));
            vertexX = xyPair[0];
            vertexY = xyPair[1];
            
            lastIntersectionInSweep = updateTheAdjacencies(this._utils, this._idGenerator, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep);
        }
    };

    IntersectionBuilder.prototype.RadialSweep = IntersectionBuilder_RadialSweep;

    var buildBoardIntersection = function(newInterId, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep) {
    
        var intersectionId = newInterId;
        
        app.vertices[intersectionId] = new Kinetic.Circle({
            x: vertexX,
            y: vertexY,
            radius: 10,
            fill: 'grey',
            stroke: 'black',
            strokeWidth: 1,
            opacity: 0.75,
            id: intersectionId
        });
        
        app.vertices[intersectionId].hide();
        
        app.verticesText[intersectionId] = new Kinetic.Text({
            x: vertexX + 10,
            y: vertexY,
            text: intersectionId,
            fontSize: 15,
            fontFamily: 'Calibri',
            fill: 'red'
        });
        
        app.verticesText[intersectionId].hide();
        
        createIntersection(intersectionId, vertexX, vertexY);
                
        boardDataManager = new app.Proxies.BoardDataManager();

        var neighborHexes = boardDataManager.initIntersectAdjHexes(intersectionId);
        neighborHexes.addNeighbor(idOfCurrentHex);
        
        var neighbors = boardDataManager.initIntersectNeighbors(intersectionId);
        neighbors.addNeighbor(intersectionId);
        neighbors.addNeighbor(lastIntersectionInSweep);

        gameBoardController.BindIntersectClick(intersectionId);
        
        return intersectionId;
    };

    var updateTheAdjacencies = function(utils, idGen, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep) {
        
        var collisionIndex = checkForCollision(utils, vertexX,vertexY);

        // No collision
        if (collisionIndex === -1)
        {
            var newIntersectId = idGen.nextIntersectionId();
            var newIntersectionId = buildBoardIntersection(newIntersectId, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep);
            
            lastIntersectionInSweep = newIntersectionId;
        }
        else
        {
            //this.handleSweepCollide(idOfCurrentHex, collisionIndex, lastIntersectionInSweep);
        
            // Don't create a new intersection
            // ...rather, update adjacent hexes list for existing intersection.
            updateIntersection(idGen, idOfCurrentHex, vertexX, vertexY, collisionIndex, lastIntersectionInSweep);
                
            lastIntersectionInSweep = collisionIndex;
        }
        
        return lastIntersectionInSweep;
    };

    updateIntersection = function(idGen, idOfCurrentHex, vertexX, vertexY, collisionIndex, lastIntersectionInSweep) {
        
        boardDataManager = new app.Proxies.BoardDataManager();

        var neighborHexes = boardDataManager.getIntersectAdjHexes(collisionIndex);
        neighborHexes.addNeighbor(idOfCurrentHex);
        
        if (lastIntersectionInSweep !== undefined)
        {
            var neighbors = boardDataManager.getIntersectNeighbors(collisionIndex);
            neighbors.addNeighbor(lastIntersectionInSweep);

            // Create a new road marker at the midway point between the current intersection (collisionIndex)
            // and the last intersection in the sweep, only if the 2 points are not the same point.
            if (lastIntersectionInSweep !== collisionIndex && !isCenterPointDrawn(collisionIndex, lastIntersectionInSweep))
            {
                var lastVertexX = app.vertices[lastIntersectionInSweep].attrs.x;
                
                var lastVertexY = app.vertices[lastIntersectionInSweep].attrs.y;
                
                placeRoadMarker(idGen, vertexX, lastVertexX, vertexY, lastVertexY, collisionIndex, lastIntersectionInSweep);

                // TODO: Perhaps need to put road centerId into adjacency list for neighboring intersections
                // ...an intersection would need a list of adjacent road segments
                // ...it would be faster than having to derrive/compute every time
                // from intersection neighbors
            }
        }
    };

    var createIntersection = function(id, x, y) {
        
        app.hexIntersectList.create({'id':id,'x':x,'y':y, 'occupyingPiece': ''});
    };
            
    var checkForCollision = function (utils, x,y){
        
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

    var isCenterPointDrawn = function(intersect1, intersect2) {
        
        for (var i = 0; i < app.roadCenterPoints.length; i++)
        {
            var intersectIdsArray = app.roadCenterPoints[i].attrs.intersectionIds;
            
            // If both intersection Ids are found in the center point, then we know
            // the center point has already been drawn
            if (intersectIdsArray.indexOf(intersect1) !== -1 &&
                    intersectIdsArray.indexOf(intersect2) !== -1)
            {
                return true;
            }
        }
        
        return false;
    };

    var placeRoadMarker = function(idGen, x2, x1, y2, y1, intersectId1, intersectId2) {

        var xLeg = (x2 - x1);
        var yLeg = (y2 - y1);
        
        // The road center point is half way between the 2 vertices
        var verticesMidpointX = x2 - xLeg/2;
        var verticesMidpointY = y2 - yLeg/2;
    
        var oppositeSideLen = y2-y1;
        var adjacentSideLen = x2-x1;
        
        // in radians
        var theta = Math.atan(oppositeSideLen/adjacentSideLen);
        
        // Restore "quadrant" (...because arctan loses signs)
        if (oppositeSideLen < 0 && adjacentSideLen < 0)
        {
            theta += Math.PI;
        }
        else if (adjacentSideLen < 0)
        {
            theta += Math.PI;
        }
        
        var inDegrees = theta/(Math.PI/180);
        
        // Translate the road so that the center point matches the center point between the 2 intersections.
        // First, find the ratio of half the road length compared to the distance between
        // the 2 intersections (vertices). Then use that ratio to calculate the corresponding x and y values
        // (i.e. scaling down the legs that form a right triangle between the vertices)
        
        var roadLength = app.RoadLength;
        var halfLength = roadLength/2;
        
        var vertexDistance = Math.sqrt(Math.pow(xLeg, 2) + Math.pow(yLeg, 2));
        
        var ratio = halfLength/vertexDistance;
        
        var roadCenterXAdjust = ratio * xLeg;
        var roadCenterYAdjust = ratio * yLeg;
        
        // roadXCenter after offset translation to put center of road on vertex midpoint
        var roadXCenter = verticesMidpointX - roadCenterXAdjust;
        var roadYCenter = verticesMidpointY - roadCenterYAdjust;
        
        var roadCenterId = idGen.nextRoadCenterId();
        
        app.roadCenterPoints[roadCenterId] = new Kinetic.Circle({
            x: verticesMidpointX,
            y: verticesMidpointY,
            radius: 10,
            fill: 'white',
            stroke: 'black',
            opacity: 0.75,
            strokeWidth: 1,
            intersectionIds: [intersectId1, intersectId2],
            id: roadCenterId,
            angle: theta,
            roadX: roadXCenter,
            roadY: roadYCenter,
            occupyingPiece: ''
        });
        
        app.roadCenterPoints[roadCenterId].hide();

        gameBoardController.BindRoadCenterClick(roadCenterId);
    };

    return {
        IntersectionBuilder : IntersectionBuilder
    };

})();