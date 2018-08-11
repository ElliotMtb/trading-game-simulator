var app = app || {};

app.AiRudi = (function() {

    function aITakePlacementTurn(playerProxy) {

        aIPlaceSettlement(playerProxy);
        aIPlaceRoad(playerProxy);
    }

    function aITakeTurn(playerProxy) {
        
        $('#rollDice').trigger('click');
        
        aITradeToBank(playerProxy);

        // If can place city, do it!
        aIPlaceCity(playerProxy);

        // Else If can place settlement, do it!
        aIPlaceSettlement(playerProxy);

        // Else if can place road, do it
        aIPlaceRoad(playerProxy);

        aIPlaceRoad(playerProxy);
    }

    function aITradeToBank(playerProxy) {

        var scarcest;
        var randIndex;

        // If has...
        //      6 or more wheat
        //      7 or more rock
        //      5 or more of brick, sheep, wood
        // Then trade it to bank at 4-1 for scarcest resource

        var bankTradeCutoffs = {
            'wheat' : 6,
            'rock' : 7,
            'brick' : 5,
            'sheep' : 5,
            'wood' : 5
        };

        function tradeGoNoGo(resourceType) {

            var scarcest;
            var randIndex;

            var resCount = playerProxy.resources[resourceType];

            if (resCount >= bankTradeCutoffs[resourceType]) {
                scarcest = playerProxy.getScarcestResource();
                randIndex = Math.round(Math.random()*(scarcest.length - 1));
                playerProxy.tradeToBank(resourceType, scarcest[randIndex].type);

                console.log("Trading 4 to 1: " + resourceType + " (has: " + resCount + ") for " + JSON.stringify(scarcest[randIndex]));
            }
        }

        var i;
        for (i = 0; i < Object.keys(bankTradeCutoffs).length; i++) {
            tradeGoNoGo(Object.keys(bankTradeCutoffs)[i]);
        }
    }

    function aIPlaceCity(playerProxy) {

        // get all unoccupied nodes that are 2-away (eligible/free)
        //var unoccupied = app.hexIntersectList.filter(x => !x.isOccupied())
        var intersectIds = app.hexIntersectList.map(x => x.get('id'));
        var evaluator = app.Rules.GetValidator();

        var eligible = intersectIds.filter(x => evaluator.isIntersectPlaceable(playerProxy, 'city', x));
        
        if (eligible.length > 0) {

            console.log("eligible cities: " + JSON.stringify(eligible));

            var randEligIndex = Math.round(Math.random()*(eligible.length - 1));
            console.log('randEligIndex: ' + randEligIndex);

            var randIntId = eligible[randEligIndex];
    
            console.log("randIntId: " + randIntId);
    
            // Found a way to trigger Kinetic object event with 'fire'
            // https://stackoverflow.com/questions/11819556/using-kineticjs-is-a-way-of-trigger-events-like-jquery
            var vertex = app.Proxies.BoardVertices().getVertexProxy(randIntId);
            vertex.fireClick();
    
            $(".city-btn").trigger("click");
        }
    }
    
    function aIPlaceSettlement(playerProxy) {

        // get all unoccupied nodes that are 2-away (eligible/free)
        //var unoccupied = app.hexIntersectList.filter(x => !x.isOccupied())
        var intersectIds = app.hexIntersectList.map(x => x.get('id'));
        var evaluator = app.Rules.GetValidator();

        var eligible = intersectIds.filter(x => evaluator.isIntersectPlaceable(playerProxy, 'settlement', x));
        
        if (eligible.length > 0) {

            console.log("eligible settlements: " + JSON.stringify(eligible));
            var randEligIndex = Math.round(Math.random()*(eligible.length - 1));
            
            console.log('randEligIndex: ' + randEligIndex);
            var randIntId = eligible[randEligIndex];
    
            console.log("randIntId: " + randIntId);
    
            // Found a way to trigger Kinetic object event with 'fire'
            // https://stackoverflow.com/questions/11819556/using-kineticjs-is-a-way-of-trigger-events-like-jquery
            var vertex = app.Proxies.BoardVertices().getVertexProxy(randIntId);
            vertex.fireClick();

            $(".settlement-btn").trigger("click");
        }
    }
    
    function aIPlaceRoad(playerProxy) {
        
        var evaluator = app.Rules.GetValidator();

        var roadManager = app.Proxies.RoadManager();

        var allRoadProxies = roadManager.getAllRoadProxies();
        var placeableRoads = allRoadProxies.filter(x => evaluator.isRoadPlaceable(playerProxy, "road", x));
    
        if (placeableRoads.length > 0) {

            var randomIndex = Math.round(Math.random()*(placeableRoads.length - 1));
        
            console.log("num neighbor roads: " + placeableRoads.length);
            console.log("randomIndex to choose neighbor road: " + randomIndex);

            var randRoadId = placeableRoads[randomIndex].id;
            roadManager.getRoadProxy(randRoadId).fireClick()
        }
    }

    return {
        aITakePlacementTurn: aITakePlacementTurn,
        aITakeTurn: aITakeTurn,
        aIPlaceCity: aIPlaceCity,
        aIPlaceSettlement: aIPlaceSettlement,
        aIPlaceRoad: aIPlaceRoad
    };

})();