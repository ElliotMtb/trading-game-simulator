var app = app || {};

app.Paths = (function() {

    function GetPathFinder() {

        /*
            How to calculate longest road:
                For each road segment belonging to a player
                    Search all contiguous paths to find the maximum-length path
                        i.e. depth-first graph traversal using current road segment as "root" (or use each neighbor intersect as separate roots of 2 depth-first searches),
                        use neighbor-intersections as children (whose respective children are its adjacent intersections (excluding the opposite neighbor of the roor neighbor)
                        ,roads adjacent to neighbor-intersection
                        "bottom" of search is reached when
                            1. Next child road segment is not occupied
                            2. Next child road segment is already part of the same depth-first chain
        */
        function findPlayerPaths(playerProxy) {

            var playerRoadProxies = app.Proxies.RoadManager().getPlayerRoadProxies(playerProxy.id);

            var i;
            for (i = 0; i < playerRoadProxies.length; i++) {
                
                var road = playerRoadProxies[i];

                console.log("Fore-facing neighber nodes: " + road.foreFacingNeighbors.toString());
                console.log("All fore-side neighbors: " + road.allForeSideNeighbors.toString());

                console.log("Aft-facing neighbor nodes: " + road.aftFacingNeighbors.toString());
                console.log("All aft-side neighbors: " + road.allAftSideNeighbors.toString());

                var initForwardPath = [road.id];
                beginRecurse(road.foreFacingNeighbors, road.foreSideId, initForwardPath, playerProxy);

                var initReversePath = [road.id];
                beginRecurse(road.aftFacingNeighbors, road.aftSideId, initReversePath, playerProxy);
            }
        }

        function beginRecurse(nextNodeIds, startingNodeId, roadIdChain, playerProxy) {

            var result;
            var i;

            console.log("Next nodes to search: " + JSON.stringify(nextNodeIds));

            for (i = 0; i < nextNodeIds.length; i++) {

                result = recursiveRoadSearch(nextNodeIds[i], startingNodeId, roadIdChain.slice(), playerProxy);
                
                var startingRoadNodes = app.Proxies.RoadManager().getRoadProxy(result[0]).intersectionIds;
                var endingRoadNodes = app.Proxies.RoadManager().getRoadProxy(result[result.length - 1]).intersectionIds;
                console.log("FOUND ROAD PATH length: " + result.length + " starting: " + startingRoadNodes.toString() + " ending: " + endingRoadNodes.toString());
                //console.log("Contents: " + JSON.stringify(result));
            }
        }

        function recursiveRoadSearch(nextNodeId, previousIntersectNodeId, roadChain, playerProxy) {

            var roadProxy = app.Proxies.RoadManager().getRoadProxyBetweenSideNodes(nextNodeId, previousIntersectNodeId);

            console.log("Checking nextId: " + nextNodeId + " prevId: " + previousIntersectNodeId);
            
            // TODO: Also end chain if "prev" node is occupied by an opponent (cutting off the road chain)
            // ...and actually placement of a settlement is cause to tryClaimLongestRoad (in which case all players'
            // longest road might need to be taken into account)
            if (!roadProxy.isRoadOccupied() ||
                !roadProxy.isRoadOccupiedByPlayer(playerProxy.id) ||
                roadChain.filter(x => x === roadProxy.id).length > 0){
                return roadChain;
            }
                
            roadChain.push(roadProxy.id);

            var forwardAdjacentIntersects = roadProxy.getNeighborsFacing(nextNodeId);

            //console.log("number of forward paths: " + forwardAdjacentIntersects.length);

            var newPrevNodeId = nextNodeId;
            var subPaths = [];
            var z;
            for (z = 0; z < forwardAdjacentIntersects.length; z++) {

                var newNextNodeId = forwardAdjacentIntersects[z];

                var returnedChain = recursiveRoadSearch(newNextNodeId, newPrevNodeId, roadChain.slice(), playerProxy);

                subPaths.push(returnedChain);
            }

            return getLongestSubPath(subPaths);
        }

        function getLongestSubPath(subPaths) {

            if (subPaths.length === 1) {

                    return subPaths[0];
            }
            else if (subPaths.length === 2) {

                if (subPaths[0].length > subPaths[1].length) {
                    return subPaths[0];
                }

                return subPaths [1];
            }
            else {

                throw "Unexpected number of sub paths";
            }
        }

        return {
            findPlayerPaths: findPlayerPaths
        }
    }

    return {
        GetPathFinder: GetPathFinder
    };
})();