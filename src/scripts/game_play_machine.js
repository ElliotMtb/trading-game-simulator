var app = app || {};

app.GamePlay = (function() {

    // Placement-phase turn phases
    var unitPlacementTurnPhase = {
        name: "placeunit",
        actions: [retrievePlayerUnitsForTurn]
    };

    // Core gameplay-phase turn phases
    var prerollTurnPhase = {
        name: "preroll",
        actions: [] 
    };
    
    var rollTurnPhase = {
        name: "roll",
        actions: []
    };

    var tradeTurnPhase = {
        name: "trade",
        actions: []
    };

    var buildTurnPhase = {
        name: "build",
        actions: []
    };

    // Game phases
    function CircularTurnSequencer() {}

    function CircularTurnSequencer_Next(currentPlayer) {

        return currentPlayer.next;
    }
    
    CircularTurnSequencer.prototype.Next = CircularTurnSequencer_Next;

    function HorseshoeTurnSequencer(circularLinkedPlayerList) {

        this.playersList = circularLinkedPlayerList;
        this.hasLastPlayerBeenHit = false;
    }

    function HorseshoeTurnSequencer_Next(currentPlayer) {

        var player;

        if (this.hasLastPlayerBeenHit === false && currentPlayer === this.playersList.Last()) {
                
            this.hasLastPlayerBeenHit = true;

            player = currentPlayer;
        }
        else if (this.hasLastPlayerBeenHit === true && currentPlayer === this.playersList.First()) {
            
            this.hasLastPlayerBeenHit = false;

            player = currentPlayer;
        }
        else {

            if (!this.hasLastPlayerBeenHit) {
                
                player = currentPlayer.next;
            }
            else {
            
                player = currentPlayer.prev;
            }
        }

        return player;
    }

    var unitsForSinglePlacementRound = [];

    function dealStartingUnits() {

        console.log(app.playerList.models);

        app.playerList.models.map(function(player) {

            var playerProxy = app.GameBoardController.GetPlayerProxy(player);

            unitsForSinglePlacementRound.push("settlement", "road", "settlement", "road");

            // TODO: Add these to a queue that gets popped from when a player starts a queue
        });
    }

    function retrievePlayerUnitsForTurn() {
        
        var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

        var unit1 = unitsForSinglePlacementRound.pop();
        var unit2 = unitsForSinglePlacementRound.pop();

        // Assume that the fist time we hit the bottom of the bucket, it means everyone has finished
        // placement
        if (unit1 === undefined)
           throw "End of Placement round! This player has no more pieces. Regular play should begin"

        playerProxy.addPurchase(unit1);
        playerProxy.addPurchase(unit2);
    }

    HorseshoeTurnSequencer.prototype.Next = HorseshoeTurnSequencer_Next;

    var placementGamePhase = {
        name: "placement",
        actions: [dealStartingUnits],
        turnPhases: new app.LinkedList.LinkedList([unitPlacementTurnPhase]),
        getTurnSequencer: function(players) { return new HorseshoeTurnSequencer(players)},
        getFirstPlayer: function(players) { return players.First()}
    };
    
    var gameplayGamePhase = {
        name: "gameplay",
        actions: [],
        turnPhases: new app.LinkedList.LinkedList([prerollTurnPhase, rollTurnPhase, tradeTurnPhase, buildTurnPhase]),
        getTurnSequencer: function(players) { return new CircularTurnSequencer(players)},
        getFirstPlayer: function(players) { return players.First()}
    };

    var gamePhases = new app.LinkedList.LinkedList([placementGamePhase, gameplayGamePhase]);

    function GamePlayMachine(players) {

        // TODO: should make these vars actually private and expose them only through 'priveleged' getter/setters
        this.playersLinkedList = players;
        this.gamePhases = gamePhases;

        this.currentGamePhase = null;
        this.currentTurnPhase = null;
        this.currentTurnPlayer = null;
        
        // Initial length 4 so that players need 5 to claim
        var longestRoad = { 
            'length': 4,
            'playerId': ''
        };

        var currentDieRoll = 0;

        this.getCurrentDieRoll = function () {
            return currentDieRoll;
        };

        this.setCurrentDieRoll = function(number) {

            if (!Number.isInteger(number) || number < 2 || number > 12)
                throw "Error. Current die roll must be set to an integer between 2 and 12";

            currentDieRoll = number
        };

        this.getLongestRoadHolder = function() {
            return {
                'length': longestRoad.length,
                'playerId': longestRoad.playerId
            };
        };

        this.tryClaimLongestRoad = function(playerProxy, playerRoadLength) {
            
            if (playerRoadLength > longestRoad.length) {
                longestRoad.length = playerRoadLength;
                longestRoad.playerId = playerProxy.id

                return true;
            }

            return false;
        };
    }

    /*
        Return the player proxy so as to support storage/binding of players in different ways
        e.g. because the internal model might look differenet if I stop using Backbone
    */
    function GamePlayMachine_GetCurrentPlayer() {

        return app.GameBoardController.GetPlayerProxy(this.currentTurnPlayer.data);
    }

    function GamePlayMachine_Start() {
        
        // Validate that everything is ready

        // Initiate first game phase
        
        this.NextGamePhase();
    }

    function GamePlayMachine_NextGamePhase() {

        // Initiate the next game phase (with the "starting" player for the phase of game)

        if (this.currentGamePhase === null) {

            this.currentGamePhase = this.gamePhases.First();
        }
        else if (this.currentGamePhase.next !== null) {

            this.currentGamePhase = this.currentGamePhase.next;
        }
        else {
            throw "No more Game Phases!";
        }

        var i;

        for (i = 0; i < this.currentGamePhase.data.actions.length; i++) {

            // Execute actions
            this.currentGamePhase.data.actions[i]();
        }

        // Set the active turn-sequencing algorithm (circular, horseshoe, etc.)
        this.activeTurnSequencer = this.currentGamePhase.data.getTurnSequencer(this.playersLinkedList);

        this.NextTurn();
    }

    function GamePlayMachine_NextTurnPhase() {
        
        if (this.currentTurnPhase === null) {

            this.currentTurnPhase = this.currentGamePhase.data.turnPhases.First();
        }
        else if (this.currentTurnPhase.next !== null) {

            this.currentTurnPhase = this.currentTurnPhase.Next();
        }
        else {
            
            throw "No more Turn Phases!";
        }

        var i;

        for (i = 0; i < this.currentTurnPhase.data.actions.length; i++) {

            // Execute actions
            this.currentTurnPhase.data.actions[i]();
        }
    }

    function GamePlayMachine_NextTurn() {

        if (this.currentTurnPlayer === null) {
            
            this.currentTurnPlayer = this.currentGamePhase.data.getFirstPlayer(this.playersLinkedList);
        }
        else {
            
            this.currentTurnPlayer = this.activeTurnSequencer.Next(this.currentTurnPlayer);
        }

        // Show current player control panel
            // If it's an AI player...then don't load control panel, but show indicator...perhaps show actions...etc.

        // Reset turn phase to null, so to start from beginning again
        this.currentTurnPhase = null;

        this.NextTurnPhase();
    }

    function GamePlayMachine_OnDieRoll() {

        // Distribute resources to all players
        //    Utilizing
        //      app.hexintersectlist ....model getOccupyingPiece()
        //      app.intersectToHexesAdjacency
        //      playerProxy.addResource(type)

        // Foreach hex where number piece = this.getCurrentDieRoll() AND hex has 1 or more occupied vertices
        //      Foreach occupied intersection (whether city or settlement)
        //          Qty to distribute = 2 if occupyingPiece.type = 'city' else 1
        //          Type is type of hex
        //          Add qty and type of resource to occupying player (occupyingPiece.playerId)

        var currentDieRoll = this.getCurrentDieRoll();

        // Note: This is weird because app.ring is an object, so can't filter on it (can only filter on ids))
        var idsOfRolledHexes = Object.keys(app.ring).filter(x => app.ring[x].getAttr('hexNumber') === currentDieRoll);
        console.log("Rolled hex ids: " + JSON.stringify(idsOfRolledHexes));

        var j;
        for (j = 0; j < idsOfRolledHexes.length; j++) {

            var rolledHexId = idsOfRolledHexes[j];
            console.log("Hex id: " + rolledHexId);

            dispurseResourcesForRolledHex(rolledHexId);
        }
    }

    function dispurseResourcesForRolledHex(rolledHexId) {

        var disburseType;
        
        disburseType = app.ring[rolledHexId].getAttr('hexType');
        console.log("Disbursement data: " + disburseType);

        var playerDispursements = getPlayerDispursements(rolledHexId);
        
        var i;
        for (i = 0; i < playerDispursements.length; i++) {
            dispurseResourceToPlayer(playerDispursements[i], disburseType);
        }
    }

    function dispurseResourceToPlayer(playerDispursement, disburseType) {

        var playerProxy = playerDispursement.playerProxy;
        var qty = playerDispursement.quantity;

        playerProxy.addMultipleResources(disburseType, qty);
    }

    function getPlayerDispursements(hexId) {

        var occupiedIntersections = app.hexIntersectList.filter(x => isIntersectOccupiedAndTouchingHex(x, hexId));
        console.log("Occupied relevant intersections: " + JSON.stringify(occupiedIntersections));

        return occupiedIntersections.map(x => getDispurseData(x));
    }

    function getDispurseData(intersect) {

        var disburseQty = 0;

        piece = intersect.getOccupyingPiece();
        console.log("Occupied intersection " + i + " :" + JSON.stringify(piece));

        // Lookup occupying piece owner (player)
        // TODO: probably don't want to use the global playerlist...should put this in
        // its own function
        playerProxy = app.GameBoardController.GetPlayerProxy(app.playerList.get(piece.playerId));

        
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

    function isIntersectOccupiedAndTouchingHex(intersect, hexId) {

        if (intersect.isOccupied()) {

            console.log("Checking if occupied intersect is touching relevant hex...");

            var intersectId = intersect.get('id');

            var hexesTouching = app.intersectToHexesAdjacency[intersectId];

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

    GamePlayMachine.prototype.Start = GamePlayMachine_Start;
    GamePlayMachine.prototype.NextTurnPhase = GamePlayMachine_NextTurnPhase;
    GamePlayMachine.prototype.NextTurn = GamePlayMachine_NextTurn;
    GamePlayMachine.prototype.NextGamePhase = GamePlayMachine_NextGamePhase;
    GamePlayMachine.prototype.GetCurrentPlayer = GamePlayMachine_GetCurrentPlayer;
    GamePlayMachine.prototype.OnDieRoll = GamePlayMachine_OnDieRoll;

    return {
        GamePlayMachine : GamePlayMachine
    };

})();