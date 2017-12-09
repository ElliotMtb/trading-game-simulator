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
        
        toggleVisibilityForArray(app.vertices);
        toggleVisibilityForArray(app.verticesText);
    }


    function Controller_ToggleRoadSelectMode() {
        
        toggleVisibilityForArray(app.roadCenterPoints);
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
        
        app.roadCenterPoints[roadCenterId].on('click', function(e){
            
            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            var roadProxy = app.Proxies.GetRoadProxy(this);

            console.log("foresideid: " + roadProxy.foreSideId + " aftsideId: " + roadProxy.aftSideId);

            console.log("SELECTED ROAD :" + JSON.stringify(roadProxy.keyRoadData));

            if (app.Rules.GetValidator().isRoadPlaceable(playerProxy, "road", roadProxy.foreSideId, roadProxy.aftSideId, roadProxy)) {

                // TODO: make a "place road" button and bind it here (like for city and settlement)
                // road.on("click", function() {})
                if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

                    playerProxy.spend("brick", 1);
                    playerProxy.spend("wood", 1);

                    playerProxy.addPurchase('road');
                }

                playerProxy.deployUnit("road");
                
                installRoadPlaceholder(playerProxy.id, "road", roadProxy.id);

                // TODO: Use "global" road length
                var road = piecesBuilder.MakeRoad(this.attrs.roadX, this.attrs.roadY, 20, playerProxy["color"], this.attrs.angle);
                
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
        
        app.vertices[intersectionId].off('click');
        app.vertices[intersectionId].on('click', function(e){

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
                "Adjacent Hexes: " + app.intersectToHexesAdjacency[intersectionId] + "<br>" +
                "Adjacent Intersections: " + app.intersectToIntersectAdjacency[intersectionId] + "<br>");
            
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
            alert("Player wins! name: " + playerProxy.name + " points: " + playerProxy.points);
        }
    }

    function installRoadPlaceholder(playerId, unitType, centerId) {
        
        var road = app.roadCenterPoints[centerId];
        road.attrs.occupyingPiece = {"type": unitType, "playerId": playerId};

        console.log("ROAD PIECE PLACED: " + JSON.stringify(road.attrs.id));
    }

    function installIntersectionPlaceholder(playerId, unitType, intersectId) {

        // Lookup intersect model and mark it as occupied by the game piece
        var intersect = app.hexIntersectList.get(intersectId);
        intersect.setOccupyingPiece({"type": unitType, "playerId": playerId});
        
        console.log("INTERSECTION PIECE PLACED: " + JSON.stringify(app.hexIntersectList.get(intersectId)));
    }

    function Controller_OnStartGame() {

        $("#dice-pan").show();
        $("#gameBoardContainer").show();
        $("#player-container").hide();

        // Don't allow game to be started more than once
        if (app.gamePhaseStatus !== "GAME_STARTED") {
            
            app.gamePhaseStatus = "GAME_STARTED";

            app.gamePlayMachine.Start();
            
            var playerProxy = app.gamePlayMachine.GetCurrentPlayer();

            app.controlPanelController.OnActivePlayerChange(playerProxy);
        }
    }

    Controller.prototype.BindControlPanelButtons		= Controller_BindControlPanelButtons;
    Controller.prototype.ToggleIntersectSelectMode 	= Controller_ToggleIntersectSelectMode;
    Controller.prototype.ToggleRoadSelectMode 		= Controller_ToggleRoadSelectMode;
    Controller.prototype.ToggleHexSelectMode 		= Controller_ToggleHexSelectMode;
    Controller.prototype.BindRoadCenterClick 		= Controller_BindRoadCenterClick;
    Controller.prototype.BindIntersectClick			= Controller_BindIntersectClick;

    Controller.prototype.OnStartGame				= Controller_OnStartGame;

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

        if(app.vertices[id].getAttr('selected'))
        {
            app.vertices[id].setStroke("black");
            app.vertices[id].setStrokeWidth("1");
            app.vertices[id].setAttr('selected', false);
            selectedIntersection = "";

        }
        else
        {
            app.vertices[id].setStroke("blue");
            app.vertices[id].setStrokeWidth("3");
            app.vertices[id].setAttr('selected', true);

            selectedIntersection = id;
        }

        app.kineticLayer.draw();
        app.vertices[id].draw();
    };

    function deselectHex(id) {
        app.ring[id].setStroke("black");
        app.ring[id].setStrokeWidth("1");
        app.ring[id].setAttr('selected', false);
        selectedHex = "";
    };

    function deselectIntersection(id) {
        app.vertices[id].setStroke("black");
        app.vertices[id].setStrokeWidth("1");
        app.vertices[id].setAttr('selected', false);
        selectedIntersection = "";
    };

    return {
        Controller : Controller
    };

})();