var app = app || {};

app.Proxies = (function() {

    function BoardVertices() {

        function init() {
            app.vertices = [];
            app.verticesText = [];
        }

        function getOccupiedAndTouchingHex(hexId) {

            var proxies = getAllVertexProxies().filter(x => x.isOccupiedAndTouchingHex(hexId));

            console.log("Occupied relevant intersections: " + JSON.stringify(proxies.map(x => x.getVertexModel())));

            return proxies;
        }

        function getPlayerDispursements(hexId) {

            var occupiedAndTouchingHex = getOccupiedAndTouchingHex(hexId);

            return occupiedAndTouchingHex.map(x => x.getDispurseData());
        }

        function getNewVertexCircle(intersectionId, vertexX, vertexY) {

            var vertex = new Kinetic.Circle({
                x: vertexX,
                y: vertexY,
                radius: 20,
                fill: 'grey',
                stroke: 'black',
                strokeWidth: 1,
                opacity: 0.5,
                id: intersectionId
            });

            return vertex;
        }

        function getNewVertexText(intersectionId, vertexX, vertexY) {

            var vertexText = new Kinetic.Text({
                x: vertexX + 10,
                y: vertexY,
                text: intersectionId,
                fontSize: 15,
                fontFamily: 'Calibri',
                fill: 'red'
            });

            return vertexText;
        }

        function addVertex(intersectionId, lastIntersectionInSweep, idOfCurrentHex, vertexX, vertexY) {

            var vertex = getNewVertexCircle(intersectionId, vertexX, vertexY);
            app.vertices[intersectionId] = vertex;
        
            var vertexText = getNewVertexText(intersectionId, vertexX, vertexY);
            app.verticesText[intersectionId] = vertexText;

            var vertexProxy = new BoardVertexProxy(vertex);

            // Create the Backbone model
            app.hexIntersectList.create({'id':intersectionId,'x':vertexX,'y':vertexY, 'occupyingPiece': ''});

            var neighborHexes = vertexProxy.initIntersectAdjHexes();
            neighborHexes.addNeighbor(idOfCurrentHex);

            vertexProxy.initIntersectNeighbors();
            vertexProxy.addNeighborIntersection(intersectionId);
            vertexProxy.addNeighborIntersection(lastIntersectionInSweep);
            
            return vertexProxy;
        }

        function getVertexProxy(intersectionId) {

            var vertex = app.vertices[intersectionId];
            
            return new BoardVertexProxy(vertex);
        }

        function getAllVertexProxies() {
            return app.vertices.map(x => new BoardVertexProxy(x));
        }

        function toggleVisibility() {

            vertices = getAllVertexProxies();

            vertices.forEach(function(x) {

                if (x.getVertex().isVisible())
                {
                    x.hide();
                }
                else
                {
                    x.show();
                }
            });
        }

        return {
            init: init,
            addVertex: addVertex,
            getVertexProxy: getVertexProxy,
            getAllVertexProxies: getAllVertexProxies,
            toggleVisibility: toggleVisibility,
            getOccupiedAndTouchingHex: getOccupiedAndTouchingHex,
            getPlayerDispursements: getPlayerDispursements,
            getVertexProxy: getVertexProxy
        };
    }

    function BoardVertexProxy(vertex) {
        
        var vertexText = app.verticesText[getId()];

        function getId() {
            return vertex.attrs.id;
        }

        function getDispurseData() {

            var disburseQty = 0;
    
            piece = getVertexModel().getOccupyingPiece();
            console.log("Occupied intersection " + i + " :" + JSON.stringify(piece));
    
            // Lookup occupying piece owner (player)
            playerProxy = app.Proxies.GetPlayerProxyById(piece.playerId);
            
            // Apply disbursement
            if (piece.type === 'city') {
    
                disburseQty = 2;
            }
            else if (piece.type === 'settlement') {
    
                disburseQty = 1;
            }
            else {
                throw "Error. Unexpected piece occupying intersection. Disbursement quantity cannot be determined";
            }
    
            return { "playerProxy" : playerProxy, "quantity" : disburseQty };
        }

        function getIntersectNeighbors() {
            return new AdjacencyList(app.intersectToIntersectAdjacency[getId()]);
        }

        function getNeighboringHexes() {
            return new AdjacencyList(app.intersectToHexesAdjacency[getId()]);
        }

        // Intersection-to-Intersection Neighbors
        function initIntersectNeighbors() {
            app.intersectToIntersectAdjacency[getId()] = [];
            return getIntersectNeighbors(getId());
        }

        function initIntersectAdjHexes() {
            app.intersectToHexesAdjacency[getId()] = [];
            return getNeighboringHexes(getId());
        }

        function highlightOnBoard() {

            vertex.setStroke("yellow");
            vertex.setStrokeWidth(3);
        }

        function fireClick() {
            vertex.fire("click");
        }

        function select() {            
            vertex.setStroke("black");
            vertex.setStrokeWidth("1");
            vertex.setAttr('selected', false);
        }

        function selectAndHighlight() {
            vertex.setStroke("blue");
            vertex.setStrokeWidth("3");
            vertex.setAttr('selected', true);
        }

        function deselect() {
            vertex.setStroke("black");
            vertex.setStrokeWidth("1");
            vertex.setAttr('selected', false);
        }

        function isSelected() {
            return vertex.getAttr('selected');
        }

        function setOccupyingPiece(unitType, playerId) {
            var vertexModel = getVertexModel();
            vertexModel.setOccupyingPiece({"type": unitType, "playerId": playerId});
        }

        function getVertexModel() {
            return app.hexIntersectList.get(getId());
        }

        function isOccupiedAndTouchingHex(hexId) {

            if (getVertexModel().isOccupied()) {
    
                console.log("Checking if occupied intersect is touching relevant hex...");
    
                var hexesTouching = getNeighboringHexes().toArray();
    
                // console.log("Intersect id: " + intersectId);
                // console.log("Hexes touching: " + JSON.stringify(hexesTouching));
                // console.log("typeof(Hexes touching): " + JSON.stringify(typeof(Object.keys(hexesTouching).map(x => hexesTouching[x]))));
                // console.log("typeof(each Hexes touching): " + JSON.stringify(hexesTouching.map(x => typeof(x))));
                // console.log("Target hexId: " + hexId);
                // console.log("typeof(target hexId): " + typeof(hexId));
    
                if (hexesTouching.indexOf(parseInt(hexId)) > -1) {
                    console.log("Occupied intersect is touching target hex!");
                    return true;
                }
            }
            
            return false;
        }

        return {
            getDispurseData: getDispurseData,
            isOccupiedAndTouchingHex, isOccupiedAndTouchingHex,
            getVertexModel: getVertexModel,
            setOccupyingPiece: setOccupyingPiece,
            fireClick: fireClick,
            isSelected: isSelected,
            select: select,
            selectAndHighlight: selectAndHighlight,
            highlightOnBoard: highlightOnBoard,
            deselect: deselect,
            hide: function() {
                vertex.hide();
                vertexText.hide();
            },
            show: function() {
                vertex.show();
                vertexText.show();
            },
            getX: function() {
                return vertex.attrs.x;
            },
            getY: function() {
                return vertex.attrs.y;
            },
            getId: getId,
            addNeighborIntersection: function(intersectionId) {

                var neighbors = getIntersectNeighbors(this.getId());
                neighbors.addNeighbor(intersectionId);
            },
            getVertex: function () {
                return vertex;
            },
            getVertexText: function() {
                return vertexText;
            },
            initIntersectNeighbors: initIntersectNeighbors,
            initIntersectAdjHexes: initIntersectAdjHexes,
            getIntersectNeighbors: getIntersectNeighbors,
            getNeighboringHexes: getNeighboringHexes
        };
    }

    function BoardDataManager() {
        
        var _verticesManager = new app.Proxies.BoardVertices();
        var _utils = app.Utility;
            
        /*
            Assumes a radial sweep is happening
        */
        function addIntersection(newInterId, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep) {
        
            var newVertex = _verticesManager.addVertex(newInterId, lastIntersectionInSweep, idOfCurrentHex, vertexX, vertexY);
            
            newVertex.hide();
        }

        /*
            Assumes a radial sweep is happening
        */
        function updateIntersection(gameBoardController, idGen, idOfCurrentHex, collisionIndex, lastIntersectionInSweep) {

            var collisionVertex = _verticesManager.getVertexProxy(collisionIndex);

            // TODO: This can be encapsulated inside VertexProxy
            var neighborHexes = collisionVertex.getNeighboringHexes();
            neighborHexes.addNeighbor(idOfCurrentHex);

            if (lastIntersectionInSweep !== undefined)
            {
                collisionVertex.addNeighborIntersection(lastIntersectionInSweep);
                
                var lastVertexProxy = _verticesManager.getVertexProxy(lastIntersectionInSweep);

                // Create a new road marker at the midway point between the current intersection (collisionIndex)
                // and the last intersection in the sweep, only if the 2 points are not the same point.
                if (lastIntersectionInSweep !== collisionIndex &&
                    !app.Proxies.RoadManager().isRoadMarkerDrawn(collisionIndex, lastIntersectionInSweep))
                {
                    var roadCenterId = idGen.nextRoadCenterId();

                    var newRoadProxy = app.Proxies.RoadManager().addRoadMarker(
                        roadCenterId, 
                        collisionVertex.getX(), lastVertexProxy.getX(),
                        collisionVertex.getY(), lastVertexProxy.getY(),
                        collisionIndex,
                        lastIntersectionInSweep
                    );

                    newRoadProxy.hide();

                    gameBoardController.BindRoadCenterClick(roadCenterId);

                    // TODO: Perhaps need to put road centerId into adjacency list for neighboring intersections
                    // ...an intersection would need a list of adjacent road segments
                    // ...it would be faster than having to derrive/compute every time
                    // from intersection neighbors
                }
            }
        }

        var indexOfExistingIntersection = function(x, y) {
            
            // Find any colliding vertices
            var vertexProxies = _verticesManager.getAllVertexProxies();

            var collisions = vertexProxies.filter(vertexProxy => isCollision(vertexProxy, x, y));

            if (collisions.length > 1) {
                throw "ERROR: Single point should never collide with more than 1 verted.";
            }
            
            // Return the index of the first vertex collision
            // findIndex returns -1 if not found
            // TODO: Perhaps should use a VertexProxy
            return vertexProxies.findIndex(i =>
                collisions.some(c =>
                    isCollision(i, c.getX(), c.getY())
                )
            );
        }
        
        /*
            Determine if 2 coordinate pairs can be considered equivalent i.e. "collide".

            Note: It's very important to account for precision differences such as:
                X value 449.99999999999994 must be considered equivalent to 450
                ...therefore I have chosen a more than generous collision margin of 2
        */
        var isCollision = function (vertexProxy, x, y){
            
            if (_utils.Distance(vertexProxy.getX(), vertexProxy.getY(), x, y) < 2)
            {
                return true;
            }

            return false;
        };

        function getNewAdjacencyList(rawList) {
            return new AdjacencyList(rawList);
        }

        // Intersection-to-Hex Neighbors/adjacency
        function initIntersectAdjHexes(intersectionId) {

        }

        function getIntersectAdjHexes(intersectionId) {
            return getNewAdjacencyList(app.intersectToHexesAdjacency[intersectionId]);
        }

        function initIntersectAdjacencies() {
            app.intersectToHexesAdjacency = [];
            app.intersectToIntersectAdjacency = [];
        }

        function getHexVertexCoords(centerX, centerY, hexRadius, radialIndex) {

            // -60 degree offset (negative is for counter-clockwise direction)
            var angleIncrement = -2 * Math.PI / 6;
            
            // -30 degree offset (negative is for counter-clockwise direction)
            var angleOffset = -2 * Math.PI / 12;

            var angleToVertex = radialIndex * angleIncrement - angleOffset;

            var xyPair = _utils.GetXYatArcEnd(centerX, centerY, hexRadius, angleToVertex);
            
            return xyPair;
        }

        return {
            getHexVertexCoords: getHexVertexCoords,
            indexOfExistingIntersection: indexOfExistingIntersection,
            addIntersection: addIntersection,
            updateIntersection: updateIntersection,
            initIntersectAdjHexes: initIntersectAdjHexes,
            getIntersectAdjHexes: getIntersectAdjHexes,
            initIntersectAdjacencies: initIntersectAdjacencies
        };
    }

    function AdjacencyList(neighbors) {

        return {
            addNeighbor: function(intersectionId) {

                // e.g. At the start of a radial sweep, there is no "previous" intersection in the sweep
                if (intersectionId !== undefined)
                {
                    // Don't add as neighbor if already present
                    if (neighbors.indexOf(intersectionId) === -1)
                    {
                        neighbors.push(intersectionId);
                    }
                }
            },
            toArray: function() { return neighbors }
        }
    }

    function RoadManager() {

        var initRoadCenters = function() {

            app.roadCenterPoints = [];
        };

        var getAllRoadProxies = function() {
            return getAllRoads().map(x => GetRoadProxy(x));
        };

        function toggleRoadsVisibility() {

            roads = getAllRoadProxies();

            roads.forEach(function(x) {

                if (x.getRoad().isVisible())
                {
                    x.getRoad().hide();
                }
                else
                {
                    x.getRoad().show();
                }
            });
        }

        var isRoadMarkerDrawn = function(intersect1, intersect2) {
        
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

        function addRoadMarker(roadCenterId, x2, x1, y2, y1, intersectId1, intersectId2) {

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
            
            var newCenter = getNewRoadCenterCircle(
                verticesMidpointX, verticesMidpointY,
                intersectId1, intersectId2,
                roadCenterId,
                theta,
                roadXCenter,
                roadYCenter
            );

            app.roadCenterPoints[roadCenterId] = newCenter;

            return GetRoadProxy(newCenter)
        };

        function getNewRoadCenterCircle(
            verticesMidpointX, verticesMidpointY,
            intersectId1, intersectId2,
            roadCenterId,
            theta,
            roadXCenter,
            roadYCenter) {
            
                var circle = new Kinetic.Circle({
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

                return circle;
        }

        function whereContainsBothIds(road, id1, id2) {
        
            if (road.attrs.intersectionIds.indexOf(id1) > -1 &&
                road.attrs.intersectionIds.indexOf(id2) > -1) {
                return true;
            }

            return false;
        }

        function getNeighboringRoads(intersectId) {
            return app.roadCenterPoints.filter(x => x.attrs.intersectionIds.some(y => y === intersectId));
        }

        function getAllRoads() {
            return app.roadCenterPoints;
        }

        return {
            getRoadProxy: function(roadCenterId) {
                return GetRoadProxy(app.roadCenterPoints[roadCenterId]);
            },
            getRoadProxyBetweenSideNodes: function (sideOneNodeId, sideTwoNodeId) {
                var allRoads = getAllRoads()
                    .filter(x => whereContainsBothIds(x, sideOneNodeId, sideTwoNodeId));

                var targetRoad = allRoads[0];
                return GetRoadProxy(targetRoad);
            },
            getNeighboringRoads: getNeighboringRoads,
            getNeighboringRoadProxies: function (intersectId) {
                return getNeighboringRoads(intersectId).map(x => GetRoadProxy(x));
            },
            getPlayerRoadProxies: function (playerId) {
                return getAllRoads()
                    .map(x => GetRoadProxy(x))
                    .filter(x => x.isRoadOccupiedByPlayer(playerId));
            },
            getAllRoadProxies: getAllRoadProxies,
            addRoadMarker: addRoadMarker,
            isRoadMarkerDrawn: isRoadMarkerDrawn,
            initRoadCenters: initRoadCenters,
            toggleRoadsVisibility: toggleRoadsVisibility
        };
    }

    function GetRoadProxy(roadCenter) {

        function keyRoadData() {
            return {
                'intersectionIds': getBothSideIds(),
                'occupyingPiece': getOccupyingPiece()
            };
        }

        function getOccupyingPiece() {
            return roadCenter.attrs.occupyigPiece;
        }

        function getBothSideIds() {
            return roadCenter.attrs.intersectionIds;
        }

        function getForeSideId() {
            return roadCenter.attrs.intersectionIds[0];
        }

        function getAftSideId() {
            return roadCenter.attrs.intersectionIds[1];
        }

        function getAllForeSideNeighbors(){
            return app.intersectToIntersectAdjacency[getForeSideId()];
        }

        function getAllAftSideNeighbors() {
            return app.intersectToIntersectAdjacency[getAftSideId()];
        }

        function getForeFacingNeighbors() {
            return getAllForeSideNeighbors().filter(x => x !== getAftSideId() && x !== getForeSideId());
        }

        function getAftFacingNeighbors() {
            return getAllAftSideNeighbors().filter(x => x !== getAftSideId() && x!== getForeSideId())
        }
        
        function getNeighborsFacing(sideId) {
            
            if (sideId === getForeSideId()) {
                return getForeFacingNeighbors();
            }
            else if (sideId === getAftSideId()) {
                return getAftFacingNeighbors();
            }
            else {
                throw "Invalid road-side. Cannot determine neighbors facing this road-side"
            }
        }

        function isRoadOccupied() {
            
            if (roadCenter.attrs.occupyingPiece &&
                roadCenter.attrs.occupyingPiece.type &&
                roadCenter.attrs.occupyingPiece.type === 'road')
                return true;
        }

        function isRoadOccupiedByPlayer(playerId) {

            if (isRoadOccupied() && roadCenter.attrs.occupyingPiece.playerId === playerId)
                return true;
        }

        function occupy(unitType, playerId) {
            roadCenter.attrs.occupyingPiece = {"type": unitType, "playerId": playerId};
        }

        return {
            id: roadCenter.attrs.id,
            intersectionIds: getBothSideIds(),
            keyRoadData: keyRoadData(),
            foreSideId: getForeSideId(),
            aftSideId: getAftSideId(),
            allForeSideNeighbors: getAllForeSideNeighbors(),
            allAftSideNeighbors: getAllAftSideNeighbors(),
            foreFacingNeighbors: getForeFacingNeighbors(),
            aftFacingNeighbors: getAftFacingNeighbors(),
            getNeighborsFacing: getNeighborsFacing,
            occupyingPiece: roadCenter.attrs.occupyingPiece,
            isRoadOccupied: isRoadOccupied,
            isRoadOccupiedByPlayer: isRoadOccupiedByPlayer,
            hide: function() { roadCenter.hide() },
            getRoad: function() { return roadCenter },
            fireClick: function() { roadCenter.fire("click") },
            occupy: occupy
        };
    }

         /*
        Public Static-esque function (i.e. not on the main "Controller" object in this module,
        but in the list of "publically" returned/exposed functions)

        Currently using Backbone Models, but I imagine I'll want to factor out backbone in the
        future in favor of moving towards Angular (most likely). As such, I want to decouple
        from the actual Backbone model where possible
    */
    function GetPlayerProxy(player) {

        console.log(player);
        console.log(app.playerList);

        return GetPlayerProxyById(player.get("id"));
    }

    function GetPlayerProxyById(playerId) {

        var playerModel = app.playerList.get(playerId);

        return {
            id: playerModel.get("id"),
            name: playerModel.get("name"),
            color: playerModel.get("color"),
            points: playerModel.get("point"),
            purchasedItems: playerModel.get("purchasedItems"),
            resources: playerModel.get("resources"),
            aiType: playerModel.get("aiType"),
            setAiType: function(ai) {
                playerModel.setAiType(ai);
            },
            deployUnit: function(type) {

                playerModel.deployPurchase(type);
            },
            addPoints: function(numPoints) {

                var i;
                for (i = 0; i < numPoints; i++) {
                    playerModel.addPoint();
                }

            },
            tradeToBank: function(typeOffer, typeAsk) {

                var offered = playerModel.get("resources")[typeOffer];

                if (offered < 4) {
                    return false;
                }
                else {
                    playerModel.spend(typeOffer, 4);
                    playerModel.addResource(typeAsk);
                    return true;
                }
            },
            getScarcestResource: function() {

                var resources = playerModel.get("resources");

                var resList = Object.keys(resources).map(x => { return { 'type': x, 'qty' : resources[x] }; });

                var scarcest = resList.reduce(
                    (accumulator, currentVal) =>  {
        
                        if (currentVal.qty < accumulator.qty) {
                            return {
                                'type' : currentVal.type,
                                'qty' : currentVal.qty
                            }
                        }
                        return {
                            'type' : accumulator.type,
                            'qty' : accumulator.qty
                        }
                    }, { 'type': 'unknown', 'qty': Infinity }
                );

                var equallyScarce = resList.filter(x => x.qty === scarcest.qty);

                console.log("Scarce resources for player: " + JSON.stringify(equallyScarce));

                return equallyScarce;
            },
            spend: function(type, quantity) {
                
                playerModel.spend(type, quantity);
            },
            addPurchase: function(type) {

                playerModel.addPurchase(type);
            },
            addResource: function(type) {

                playerModel.addResource(type);
            },
            addMultipleResources: function(type, qty) {

                var i;
                for (i = 0; i < qty; i++) {
                    playerModel.addResource(type);
                }
            }
        };

    }

    return {
        BoardVertices: BoardVertices,
        BoardVertexProxy, BoardVertexProxy,
        BoardDataManager: BoardDataManager,
        AdjacencyList: AdjacencyList,
        GetRoadProxy: GetRoadProxy,
        RoadManager: RoadManager,
        GetPlayerProxy: GetPlayerProxy,
        GetPlayerProxyById: GetPlayerProxyById
    };

})();