var app = app || {};

app.GameBoardController = (function() {

    // These are assentially "static" variables
    var piecesBuilder = new app.Pieces.PiecesBuilder();
    
    var selectedHex = "";
    var selectedIntersection = "";

    function Controller() {}

    function Controller_BindControlPanelButtons() {

        var that = this;

        $("#toggleIntersectSelectMode").on("click", function() {
            
            that.ToggleIntersectSelectMode();
        });
        
        $("#toggleRoadSelectMode").on("click", function() {
            
            that.ToggleRoadSelectMode();
        });
        
        $("#toggleHexSelectMode").on("click", function() {
        
            that.ToggleHexSelectMode();
        });

        $("#endTurn").on("click", function() {

            app.gamePlayMachine.NextTurn();

            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            app.controlPanelController.OnActivePlayerChange(playerProxy);
        });

        $("#nextGamePhase").on("click", function() {

            app.gamePlayMachine.NextGamePhase();

            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();
            
            app.controlPanelController.OnActivePlayerChange(playerProxy);
        });

        $("#rollDice").on("click", function() {

            var dieOne = Math.round(Math.random()*5);
            var dieTwo = Math.round(Math.random()*5);

            var diceImgs = [
                "../assets/images/dice_1.png",
                "../assets/images/dice_2.png",
                "../assets/images/dice_3.png",
                "../assets/images/dice_4.png",
                "../assets/images/dice_5.png",
                "../assets/images/dice_6.png"
            ];

            $("#dieOne").attr("src", diceImgs[dieOne]);
            $("#dieTwo").attr("src", diceImgs[dieTwo]);

            app.gamePlayMachine.setCurrentDieRoll(2 + dieOne + dieTwo);

            console.log("Die roll: " + app.gamePlayMachine.getCurrentDieRoll());

            app.gamePlayMachine.OnDieRoll();

            app.controlPanelController.Refresh(app.gamePlayMachine.GetCurrentPlayer());
        });
        
    }

    function Controller_ToggleIntersectSelectMode() {
        
        app.Proxies.BoardVertices().toggleVisibility();

        app.kineticLayer.draw();
    }


    function Controller_ToggleRoadSelectMode() {
        
        app.Proxies.RoadManager().toggleRoadsVisibility();
        app.kineticLayer.draw();
    }

    function Controller_ToggleHexSelectMode() {
        
        toggleVisibilityForObject(app.ringText)
        
        var bindOn = function(hex) {
            bindHexClick(hex.getAttr("id"));
        };
        
        var bindOff = function(hex) {
            hex.off("click");
        };
        
        var bindClick = function(binder) {
            
            // Deselect selected hex
            // Unbind all hex clicks
            for (var prop in app.ring) {
                
                var hex = app.ring[prop];
                var hexId = hex.getAttr('id');
                
                if (hex instanceof Kinetic.RegularPolygon) {
                    
                    binder(hex);
                    
                    if (selectedHex === hexId) {
                        
                        toggleSelectedHex(hexId);
                    }
                }
            }
        };
        
        if (app.HexSelectMode)
        {
            bindClick(bindOff);
            app.HexSelectMode = false;
        }
        else
        {
            bindClick(bindOn);
            app.HexSelectMode = true;
        }	
    };

    function Controller_BindRoadCenterClick(roadCenterId) {
        
        var roadProxy = app.Proxies.RoadManager().getRoadProxy(roadCenterId);

        roadProxy.getRoad().on('click', function(e){
            
            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            var roadProxy = app.Proxies.GetRoadProxy(this);

            console.log("roadCenterId: " + roadProxy.id + " foresideid: " + roadProxy.foreSideId + " aftsideId: " + roadProxy.aftSideId);

            console.log("SELECTED ROAD :" + JSON.stringify(roadProxy.keyRoadData));

            if (app.Rules.GetValidator().isRoadPlaceable(playerProxy, "road", roadProxy)) {

                // TODO: make a "place road" button and bind it here (like for city and settlement)
                // road.on("click", function() {})
                if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

                    playerProxy.spend("brick", 1);
                    playerProxy.spend("wood", 1);

                    playerProxy.addPurchase('road');
                }

                playerProxy.deployUnit("road");
                
                installRoadPlaceholder(playerProxy.id, "road", roadProxy.id);

                var road = piecesBuilder.MakeRoad(this.attrs.roadX, this.attrs.roadY, app.RoadLength, playerProxy["color"], this.attrs.angle);
                
                app.kineticLayer.add(road);
                app.kineticLayer.draw();

                // Check for longest road
                var pathLength = getPlayerLongestRoad(playerProxy);

                var prevLongestRoadHolder = app.gamePlayMachine.getLongestRoadHolder();

                // Update claim on longest road (increment and/or change hands)
                if (app.gamePlayMachine.tryClaimLongestRoad(playerProxy, pathLength)) {

                    console.log("Longest road claim successful. New length: " + pathLength);
                    console.log("prevlongestRoadHolderId: " + prevLongestRoadHolder.playerId + " playerProxy.id: " + playerProxy.id + " prevLongHolder: " + JSON.stringify(prevLongestRoadHolder));

                    
                    // If changed hands...
                    if (prevLongestRoadHolder.playerId !== playerProxy.id || prevLongestRoadHolder.playerId === '') {

                        console.log("Longest road changed hands");
                        playerProxy.addPoints(2);

                        if (prevLongestRoadHolder.playerId !== '') {

                            var loserProxy = app.Proxies.GetPlayerProxyById(prevLongestRoadHolder.playerId);
                            loserProxy.addPoints(-2);
                        }
                        

                        console.log("Longest road points awarded");
                    }
                }
                
                checkForVictory(playerProxy);

                var updatedPlayerInfo = app.gamePlayMachine.GetCurrentPlayer();
                console.log("Current player stats after road placement: " + JSON.stringify(updatedPlayerInfo));
                app.controlPanelController.Refresh(updatedPlayerInfo);
            }
        });
    };

    function Controller_BindIntersectClick(intersectionId) {
        
        var vertex = app.Proxies.BoardVertices()
            .getVertexProxy(intersectionId)
            .getVertex();

        vertex.off('click');
        vertex.on('click', function(e){

            var intersectId = this.attrs.id;
            var intersectX = this.attrs.x;
            var intersectY = this.attrs.y;
            
            selectIntersect(intersectId);
            
            var settlement = $("<button>", {
                "class": "settlement-btn",
                "text": "Settlement"
            });
            
            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            var itemDrawColor = playerProxy["color"];
            
            if (app.Rules.GetValidator().isIntersectPlaceable(playerProxy, "settlement", intersectId)) {

                settlement.on("click", function() {

                    if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

                        playerProxy.spend("wheat", 1);
                        playerProxy.spend("sheep", 1);
                        playerProxy.spend("brick", 1);
                        playerProxy.spend("wood", 1);

                        playerProxy.addPurchase('settlement');
                    }
                    else if (app.gamePlayMachine.currentGamePhase.data.name === "placement") {

                        // TODO: Decrement counter (for the type of unit placed) tracking all units to be placed
                        // this round of this phase (e.g. 1 road, 1 settlement to be placed per round)
                        // OPTION 2 - alternatively, only give the user the units to place at the beginning of the round
                        //
                        // holding them in a queue at the round-level management (i.e. instead of initializing
                        // player with all units right up front, wait to allocated them)
                        //
                        // OPTION 3 ....or, queue them up at the beginning of the round, and have the user fetch the allotment
                        // when their turn comes (I like this option, becuase I don't have any event that happens at the end of
                        // a round. Then, I guess I can signal the end of the placement phase when all users run out of their allotments
                        // ...which should can be detected when new turn begins and player has no resources)
                    }

                    playerProxy.deployUnit("settlement");
                    
                    playerProxy.addPoints(1);

                    checkForVictory(playerProxy);

                    installIntersectionPlaceholder(playerProxy.id, "settlement", intersectId);

                    piecesBuilder.MakeSettlement(intersectX, intersectY, 10, itemDrawColor, app.kineticLayer);
                    app.kineticLayer.draw();
                });
            }
            
            var city = $("<button>", {
                "class": "city-btn",
                "text": "City"
            });
            
            if (app.Rules.GetValidator().isIntersectPlaceable(playerProxy, "city", intersectId)) {

                city.on("click", function() {

                    if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

                        playerProxy.spend("wheat", 2);
                        playerProxy.spend("rock", 3);

                        playerProxy.addPurchase('city');
                    }

                    playerProxy.deployUnit("city");
                    
                    playerProxy.addPoints(1);

                    checkForVictory(playerProxy);

                    installIntersectionPlaceholder(playerProxy.id, "city", intersectId);

                    piecesBuilder.MakeCity(intersectX, intersectY, 10, itemDrawColor, app.kineticLayer);
                    app.kineticLayer.draw();
                });
            }

            $("#selectedIntersect").html("Selected Intersection: <br> Id: " + intersectId + "<br>" +
                "Adjacent Hexes: " + app.Proxies.BoardVertices().getVertexProxy(intersectionId).getNeighboringHexes().toArray() + "<br>" +
                "Adjacent Intersections: " + app.Proxies.BoardVertices().getVertexProxy(intersectionId).getIntersectNeighbors().toArray() + "<br>");
            
            $("#selectedIntersect").append(settlement, city);
        
        });
    };

    function getPlayerLongestRoad(playerProxy) {

        var paths = app.Paths.GetPathFinder().findPlayerPaths(playerProxy);

        console.log("Paths: " + JSON.stringify(paths));
        
        var longestPath = paths.reduce(
            (accumulator, currentVal) =>  {

                if (currentVal.length > accumulator[0]) {
                    return [
                        currentVal.length,
                        currentVal
                    ]
                }
                return [
                    accumulator[0],
                    accumulator[1]
                ]
            }, [0, []]
        );

        console.log("Longest path: " + JSON.stringify(longestPath));

        var startingRoadNodes = app.Proxies.RoadManager().getRoadProxy(longestPath[1][0]).intersectionIds;
        var endingRoadNodes = app.Proxies.RoadManager().getRoadProxy(longestPath[1][longestPath[1].length - 1]).intersectionIds;
        console.log("LONGEST PATH FOUND - length: " + longestPath[0] + " starting: " + startingRoadNodes.toString() + " ending: " + endingRoadNodes.toString());

        return longestPath[0];
    }

    function checkForVictory(playerProxy) {

        if (playerProxy.points >= 13) {
            var turns = app.gamePlayMachine.GetTurnCount();

            var playerColor = playerProxy.color;
            throw "Player wins after " + turns + " total turns! color: " + playerColor + " name: " + playerProxy.name + " points: " + playerProxy.points;
        }
    }

    function installRoadPlaceholder(playerId, unitType, centerId) {
        
        var roadProxy = app.Proxies.RoadManager().getRoadProxy(centerId);
        roadProxy.occupy(unitType, playerId);

        console.log("ROAD PIECE PLACED: " + JSON.stringify(roadProxy.id));
    }

    function installIntersectionPlaceholder(playerId, unitType, intersectId) {

        // Lookup intersect model and mark it as occupied by the game piece
        var intersect = app.Proxies.BoardVertices().getVertexProxy(intersectId);
        intersect.setOccupyingPiece(unitType, playerId);
        
        console.log("INTERSECTION PIECE PLACED: " + JSON.stringify(intersect.getVertexModel()));
    }

    function Controller_OnStartGame(isMinimalView) {

        if (!isMinimalView) {

            $("#dice-pan").show();
        }
        else {

            $(".spa-shell-head").hide();
            $(".spa-shell-main-nav").hide();
        }

        $("#gameBoardContainer").show();
        $("#player-container").hide();

        // Don't allow game to be started more than once
        if (app.gamePhaseStatus !== "GAME_STARTED") {
            
            app.gamePhaseStatus = "GAME_STARTED";

            app.gamePlayMachine.Start();
            
            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            app.controlPanelController.OnActivePlayerChange(playerProxy);

            isAiOnlyGame = false;

            if (isAiOnlyGame) {
            // AI play
            var numPlayers = app.playerList.length;

            // TODO: Until have a better way to set up AI players
            var x;
            for (x = 0; x < app.playerList.models.length; x++)
            {
                if (x == 0)
                {
                    app.playerList.models[x].setAiType('homing');
                }
                else
                {
                    app.playerList.models[x].setAiType('rudi');
                }
            }

            aIsetup(numPlayers);

            app.gamePlayMachine.NextGamePhase();

            // Play x number of turns or until someone wins
            try
            {
                aIPlayGame(200);
            }
            catch (e) {

                // Log win message
                console.log(e);
                // Show "win" message in control panel
                app.controlPanelController.OnWin(e);
                throw e;
                }
            }

        }
    }

    Controller.prototype.BindControlPanelButtons		= Controller_BindControlPanelButtons;
    Controller.prototype.ToggleIntersectSelectMode 	= Controller_ToggleIntersectSelectMode;
    Controller.prototype.ToggleRoadSelectMode 		= Controller_ToggleRoadSelectMode;
    Controller.prototype.ToggleHexSelectMode 		= Controller_ToggleHexSelectMode;
    Controller.prototype.BindRoadCenterClick 		= Controller_BindRoadCenterClick;
    Controller.prototype.BindIntersectClick			= Controller_BindIntersectClick;
    
    Controller.prototype.OnStartGame				= Controller_OnStartGame;

    function aIsetup(numPlayers) {

        var playerProxy;

        var aiType = null;

        var i;
        for (i = 0; i < (numPlayers * 2) - 1; i++) {

            playerProxy = app.gamePlayMachine.GetCurrentPlayer();
    
            aiType = getActiveAi(playerProxy);

            aiType.aITakePlacementTurn(playerProxy);

            $("#endTurn").trigger("click");
        }

        // last time not calling end turn, because next game phase will take care of it after this
        playerProxy = app.gamePlayMachine.GetCurrentPlayer();

        aiType = getActiveAi(playerProxy);
        aiType.aITakePlacementTurn(playerProxy);
    }

    function getActiveAi(playerProxy) {

        var aiType = null;

        if (playerProxy.aiType === "homing"){

            aiType = app.AiResourceHoming;
        }
        else if (playerProxy.aiType === "rudi"){
            aiType = app.AiRudi;
        }
        else {
            throw "Unknown ai type";
        }

        return aiType;
    }

    function aIPlayGame(numTurns) {

        var playerProxy;

        var i;
        for (i = 0; i < numTurns; i++) {
            playerProxy = app.gamePlayMachine.GetCurrentPlayer();
            app.AiRudi.aITakeTurn(playerProxy);
            $("#endTurn").trigger("click");
        }
    }

    function toggleVisibilityForArray(items) {
                    
        var i;
        for (i=0; i < items.length; i++)
        {
            var item = items[i];
            
            toggleKineticJSVisible(item)
        }
        
        app.kineticLayer.draw();
    };

    function toggleVisibilityForObject(kineticJSObject) {
        
        for (var item in kineticJSObject)
        {
            var itemToToggle = kineticJSObject[item];
            
            toggleKineticJSVisible(itemToToggle);
        }
        
        app.kineticLayer.draw();
    };

    function toggleKineticJSVisible(item) {
        
        if (item.isVisible())
        {
            item.hide();
        }
        else
        {
            item.show();
        }
    };
        

    function bindHexClick(hexId) {
        
        app.ring[hexId].on('click', function(e){

            selectHex(this.getAttr('id'));
        });
    };

    function selectHex(id){

        if (selectedHex == id)
        {
            toggleSelectedHex(id);

        }
        else
        {
            if (selectedHex != "")
            {
                deselectHex(selectedHex);
                toggleSelectedHex(id);
            }
            else
            {
                toggleSelectedHex(id);
            }
        }
    };

    function selectIntersect(id) {
        
        if (selectedIntersection === id)
        {
            toggleSelectedIntersection(id);
        }
        else
        {
            if (selectedIntersection !== "")
            {
                deselectIntersection(selectedIntersection);
                toggleSelectedIntersection(id);
            }
            else
            {
                toggleSelectedIntersection(id);
            }
        }
    };

    function toggleSelectedHex(id){

        if(app.ring[id].getAttr('selected'))
        {
            app.ring[id].setStroke("black");
            app.ring[id].setStrokeWidth("1");
            app.ring[id].setAttr('selected', false);
            selectedHex = "";

        }
        else
        {
            app.ring[id].setStroke("blue");
            app.ring[id].setStrokeWidth("3");
            app.ring[id].setAttr('selected', true);

            selectedHex = id;
        }

        app.kineticLayer.draw();
        app.ring[id].draw();

    };

    function toggleSelectedIntersection(id) {

        var vertex = app.Proxies.BoardVertices().getVertexProxy(id);

        if(vertex.isSelected())
        {
            vertex.deselect();
            selectedIntersection = "";

        }
        else
        {
            vertex.selectAndHighlight();

            selectedIntersection = id;
        }

        app.kineticLayer.draw();
        vertex.getVertex().draw();
    };

    function deselectHex(id) {
        app.ring[id].setStroke("black");
        app.ring[id].setStrokeWidth("1");
        app.ring[id].setAttr('selected', false);
        selectedHex = "";
    };

    function deselectIntersection(id) {

        var vertex = app.Proxies.BoardVertices().getVertexProxy(id);
        vertex.deselect();
        
        selectedIntersection = "";
    };

    return {
        Controller : Controller
    };

})();