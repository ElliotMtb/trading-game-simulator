var app = app || {};

app.Proxies = (function() {

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

    return {
        GetRoadProxy: GetRoadProxy,
        RoadManager: RoadManager
    };

})();