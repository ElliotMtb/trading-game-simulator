var app = app || {};

app.Proxies = (function() {

    function BoardDataManager() {
        
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
        BoardDataManager: BoardDataManager,
        AdjacencyList: AdjacencyList,
        GetRoadProxy: GetRoadProxy,
        RoadManager: RoadManager,
        GetPlayerProxy: GetPlayerProxy,
        GetPlayerProxyById: GetPlayerProxyById
    };

})();