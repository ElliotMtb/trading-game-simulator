var app = app || {};

app.Proxies = (function() {

    function BoardVertices() {

        function addVertex(intersectionId, vertexX, vertexY) {
            
            var vertex = new Kinetic.Circle({
                x: vertexX,
                y: vertexY,
                radius: 10,
                fill: 'grey',
                stroke: 'black',
                strokeWidth: 1,
                opacity: 0.75,
                id: intersectionId
            });

            app.vertices[intersectionId] = vertex;

            vertex.hide();
        
            var vertexText = new Kinetic.Text({
                x: vertexX + 10,
                y: vertexY,
                text: intersectionId,
                fontSize: 15,
                fontFamily: 'Calibri',
                fill: 'red'
            });
            
            app.verticesText[intersectionId] = vertexText;
            vertexText.hide();

            createIntersectionModel(intersectionId, vertexX, vertexY);

            return BoardVertexProxy(intersectionId);
        }

        var createIntersectionModel = function(id, x, y) {
        
            app.hexIntersectList.create({'id':id,'x':x,'y':y, 'occupyingPiece': ''});
        };

        return {
            addVertex: addVertex
        };
    }

    function BoardVertexProxy(intersectionId) {
        
        var vertex = app.vertices[intersectionId];

        return {
            hide: function(intersectId) {
                vertex.hide();
            }
        };
    }

    function BoardDataManager() {
        
        var _verticesManager = new app.Proxies.BoardVertices();

        /*
            Assumes a radial sweep is happening
        */
        function addIntersection(newInterId, idOfCurrentHex, vertexX, vertexY, lastIntersectionInSweep) {
            
            var intersectionId = newInterId;
        
            _verticesManager.addVertex(intersectionId, vertexX, vertexY);
            
            var neighborHexes = initIntersectAdjHexes(intersectionId);
            neighborHexes.addNeighbor(idOfCurrentHex);
            
            var neighbors = initIntersectNeighbors(intersectionId);
            neighbors.addNeighbor(intersectionId);
            neighbors.addNeighbor(lastIntersectionInSweep);
        }

        /*
            Assumes a radial sweep is happening
        */
        function updateIntersection(gameBoardController, idGen, idOfCurrentHex, vertexX, vertexY, collisionIndex, lastIntersectionInSweep) {

            var neighborHexes = getIntersectAdjHexes(collisionIndex);
            
            neighborHexes.addNeighbor(idOfCurrentHex);
            
            if (lastIntersectionInSweep !== undefined)
            {
                var neighbors = getIntersectNeighbors(collisionIndex);
                neighbors.addNeighbor(lastIntersectionInSweep);

                // Create a new road marker at the midway point between the current intersection (collisionIndex)
                // and the last intersection in the sweep, only if the 2 points are not the same point.
                if (lastIntersectionInSweep !== collisionIndex && !isCenterPointDrawn(collisionIndex, lastIntersectionInSweep))
                {
                    var lastVertexX = app.vertices[lastIntersectionInSweep].attrs.x;
                    
                    var lastVertexY = app.vertices[lastIntersectionInSweep].attrs.y;
                    
                    var roadCenterId = idGen.nextRoadCenterId();
                    placeRoadMarker(roadCenterId, vertexX, lastVertexX, vertexY, lastVertexY, collisionIndex, lastIntersectionInSweep);
                    gameBoardController.BindRoadCenterClick(roadCenterId);

                    // TODO: Perhaps need to put road centerId into adjacency list for neighboring intersections
                    // ...an intersection would need a list of adjacent road segments
                    // ...it would be faster than having to derrive/compute every time
                    // from intersection neighbors
                }
            }
        }

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

        var placeRoadMarker = function(roadCenterId, x2, x1, y2, y1, intersectId1, intersectId2) {

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
        };

        function getNewAdjacencyList(rawList) {
            return new AdjacencyList(rawList);
        }

        // Intersection-to-Intersection Neighbors
        function initIntersectNeighbors(intersectionId) {
            app.intersectToIntersectAdjacency[intersectionId] = [];
            return getIntersectNeighbors(intersectionId);
        }

        function getIntersectNeighbors(intersectionId) {
            return getNewAdjacencyList(app.intersectToIntersectAdjacency[intersectionId]);
        }

        // Intersection-to-Hex Neighbors/adjacency
        function initIntersectAdjHexes(intersectionId) {
            app.intersectToHexesAdjacency[intersectionId] = [];
            return getIntersectAdjHexes(intersectionId);
        }

        function getIntersectAdjHexes(intersectionId) {
            return getNewAdjacencyList(app.intersectToHexesAdjacency[intersectionId]);
        }

        return {
            addIntersection: addIntersection,
            updateIntersection: updateIntersection,
            initIntersectNeighbors: initIntersectNeighbors,
            getIntersectNeighbors: getIntersectNeighbors,
            initIntersectAdjHexes: initIntersectAdjHexes,
            getIntersectAdjHexes: getIntersectAdjHexes
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
            }
        }
    }

    function RoadManager() {

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
            getAllRoadProxies: function() {
                return getAllRoads().map(x => GetRoadProxy(x));
            }
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
            isRoadOccupiedByPlayer: isRoadOccupiedByPlayer
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