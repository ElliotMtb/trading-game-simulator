var app = app || {};

app.Rules = (function() {

    function GetValidator() {

        function isSettlementPlaceable(playerProxy, intersectId) {

            if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {
                if (!isSettlementContiguousForPlayer(playerProxy, intersectId))
                    return false;
            }

            // Note that an already occupied intersection fails the two away check as well
            if (!isSettlementTwoAway(intersectId)) {

                console.log("TWO AWAY CHECK FAILED");
                return false;
            }

            return true;
        }

        function isCityPlaceable(playerProxy, intersectId) {

            if (hasOwnSettlement(playerProxy, intersectId))
                return true;

            return false;
        }

        function hasOwnSettlement(playerProxy, intersectId) {

            var intersect = app.hexIntersectList.get(intersectId);

            if (intersect.isOccupied() &&
                intersect.getOccupyingPiece().type === "settlement" &&
                intersect.getOccupyingPiece().playerId === playerProxy.id)
                return true;

            return false;
        }

        function isIntersectPlaceable(playerProxy, unitType, intersectId) {

            if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {
                if (!canAffordPurchase(playerProxy, unitType))
                    return false;
            }

            if (unitType === 'settlement') {
                
                return isSettlementPlaceable(playerProxy, intersectId);
            }
            else if (unitType === 'city') {

                console.log("Checking city bindability...");

                return isCityPlaceable(playerProxy, intersectId);
            }
            else {
                throw "Error. Unknown unit type. Cannot determine if intersection is placeable";
            }

        }

        function isRoadPlaceable(playerProxy, unitType, roadProxy) {

            if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {
                if (!canAffordPurchase(playerProxy, unitType))
                    return false;
            }

            if (roadProxy.isRoadOccupied())
                return false;

            if (!isRoadContiguousForPlayer(playerProxy, roadProxy)) {
                return false;
            }

            return true;
        }

        function canAffordPurchase(playerProxy, unitType) {

            if (unitType === 'city') {
                
                if (playerProxy.resources['rock'] - 3 >= 0 &&
                    playerProxy.resources['wheat'] - 2 >= 0)
                    return true;
            }
            else if (unitType === 'settlement') {

                if (playerProxy.resources['brick'] - 1 >= 0 &&
                    playerProxy.resources['wood'] - 1 >= 0 &&
                    playerProxy.resources['wheat'] - 1 >= 0 &&
                    playerProxy.resources['sheep'] - 1 >= 0)
                    return true;
            }
            else if (unitType === 'road') {

                if (playerProxy.resources['brick'] - 1 >= 0 &&
                    playerProxy.resources['wood'] - 1 >= 0)
                    return true;
            }
            else {
                throw "Error. Cannot determine affordability of unkonwn unitType";
            }

            return false;
        }

        /*
            Candidate road segment (edge) is contiguous if 1 of the following is true:
            1. Immediately neighboring intersection is occupied by the same player
            2. Immediately neighboring road segment (edge) is occupied by the same player
        */
        function isRoadContiguousForPlayer(playerProxy, roadProxy) {

            // Neighboring road edges can be found as the midpoint between both neighboring intersections
            // (on either side of selected road edge) and their respective neighbors

            var foreSideNeighbor = app.hexIntersectList.get(roadProxy.foreSideId)
            var aftSideNeighbor = app.hexIntersectList.get(roadProxy.aftSideId)

            console.log("Neighbor intersects to check: " + roadProxy.foreSideId + "," + roadProxy.aftSideId);
            console.log("Fore-side neighbor: " + JSON.stringify(foreSideNeighbor));
            console.log("Aft-side neighbor:" + JSON.stringify(aftSideNeighbor));

            // First (easy check) - Is either road-edge intersect-neighbor occuppied by same player?
            if (foreSideNeighbor.isOccupiedByPlayer(playerProxy.id) || aftSideNeighbor.isOccupiedByPlayer(playerProxy.id)) {
                return true;
            }
            
            // Second (if first condition not true) - Does either intersect neighbor have 1 or more 'friendly' adjecent roads (ONLY IF neighbor not occupied by other player)
            //      Fetch adjacent roads (for neighbor vertex/intersection):
            //          For each external intersection neighbor (non-self neighbor):
            //              Adjacent road segment = app.roadCenterPoints where 'intersectionIds' contains BOTH current intersectionId AND neighbor id of interest
            //
            //      Amongst all fetched road segments, if 1 or more is occupied by the player, then return true

            // Check neighbor 1
            if (foreSideNeighbor.isOccupied() === false) {

                console.log("Neighbor 1 not occupied");

                if (playerOwnsRoadAdjacentToNeighborIntersection(roadProxy.foreSideId, playerProxy.id)) {
                    return true;
                }
            }

            // Check neighbor 2
            if (aftSideNeighbor.isOccupied() === false) {

                console.log("Neighbor 2 not occupied");

                if (playerOwnsRoadAdjacentToNeighborIntersection(roadProxy.aftSideId, playerProxy.id)) {
                    return true;
                }
            }

            function playerOwnsRoadAdjacentToNeighborIntersection(roadNeighborIntersectId, currentPlayerId) {

                var roadProxy;

                console.log("NeighborIntId: " + roadNeighborIntersectId)
                var neighborAdjList = app.intersectToIntersectAdjacency[roadNeighborIntersectId];

                console.log("Neighbor adjacency list: " + neighborAdjList);

                var adjacentRoadSegments = [];

                var i = 0;
                for (i = 0; i < neighborAdjList.length; i++) {

                    if (neighborAdjList[i] !== roadNeighborIntersectId) {

                        roadProxy = app.Proxies.RoadManager().getRoadProxyBetweenSideNodes(roadNeighborIntersectId, neighborAdjList[i]);

                        console.log("Road segment: " + JSON.stringify(roadProxy.keyRoadData));

                        adjacentRoadSegments.push(roadProxy);
                    }
                }

                console.log("Adjacent road segments: " + JSON.stringify(adjacentRoadSegments.map(x => x.keyRoadData)));

                var any = adjacentRoadSegments.filter(x => x.isRoadOccupiedByPlayer(currentPlayerId));

                console.log("Friendly roads adjacent to neighbor intersect?: " + JSON.stringify(any.map(x => x.keyRoadData)));

                if (any.length >= 1) {
                    return true;
                }

                return false;
            }

            return false;
        }

        /*
            Check all immediate neighbor intersections (note: this includes selected intersectionId)
            If any settlement is found, then return false
        */
        function isSettlementTwoAway(intersectId) {

            var neighborInfo = app.intersectToIntersectAdjacency[intersectId];
            console.log("Neighbor ids: " + neighborInfo);

            var i = 0;
            var current;
            for (i = 0; i < neighborInfo.length; i++) {

                current = app.hexIntersectList.get(neighborInfo[i]);

                console.log("Checking occupation: " + neighborInfo[i] + "\n" + JSON.stringify(current.getOccupyingPiece()));

                if (current.isOccupied()) {

                    return false;
                }
            }

            return true;
        }

        function isSettlementContiguousForPlayer(playerProxy, intersectId) {

            // Intersection must have neighboring owned roads (i.e. neighboring center points occupied with road owned by same player)
            app.intersectToIntersectAdjacency[intersectId];

            // Neighboring center points where
            var neighborRoadProxies = app.Proxies.RoadManager().getNeighboringRoadProxies(intersectId);

            return neighborRoadProxies.some(x => x.isRoadOccupied() && x.isRoadOccupiedByPlayer(playerProxy.id));
        }

        return {
            isIntersectPlaceable: isIntersectPlaceable,
            isRoadPlaceable: isRoadPlaceable
        };
    }

    return {
        GetValidator: GetValidator
    };

})();
