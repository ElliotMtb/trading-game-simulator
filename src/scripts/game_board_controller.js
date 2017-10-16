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

			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer.data);

			app.controlPanelController.OnActivePlayerChange(playerProxy);
		});

		$("#nextGamePhase").on("click", function() {

			app.gamePlayMachine.NextGamePhase();

			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer.data);
			
			app.controlPanelController.OnActivePlayerChange(playerProxy);
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

			if (isRoadPlaceable(playerProxy, "road", this.attrs.roadX, this.attrs.roadY)) {

				// TODO: make a "place road" button and bind it here (like for city and settlement)
				// road.on("click", function() {})
				if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

					playerProxy.spend("brick", 1);
					playerProxy.spend("wood", 1);
				}

				playerProxy.deployUnit("road");

				// TODO: Use "global" road length
				var road = piecesBuilder.MakeRoad(this.attrs.roadX, this.attrs.roadY, 20, playerProxy["color"], this.attrs.angle);
				
				app.kineticLayer.add(road);
				app.kineticLayer.draw();
			}
		});
	};

	function Controller_BindIntersectClick(intersectionId) {
		
		app.vertices[intersectionId].on('click', function(e){

			var intersectId = this.attrs.id;
			var intersectX = this.attrs.x;
			var intersectY = this.attrs.y;
			
			selectIntersect(intersectId);
			
			var settlement = $("<button>", {
				"class": "settlement-btn",
				"text": "Settlement"
			});
			
			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer.data);

			var itemDrawColor = playerProxy["color"];
			
			if (isIntersectPlaceable(playerProxy, "settlement", intersectX, intersectY)) {

				settlement.on("click", function() {

					if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

						playerProxy.spend("wheat", 1);
						playerProxy.spend("sheep", 1);
						playerProxy.spend("brick", 1);
						playerProxy.spend("wood", 1);
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
					
					piecesBuilder.MakeSettlement(intersectX, intersectY, 10, itemDrawColor, app.kineticLayer);
					app.kineticLayer.draw();
				});
			}
			
			var city = $("<button>", {
				"class": "city-btn",
				"text": "City"
			});
			
			if (isIntersectPlaceable(playerProxy, "city", intersectX, intersectY)) {

				city.on("click", function() {

					if (app.gamePlayMachine.currentGamePhase.data.name === "gameplay") {

						playerProxy.spend("wheat", 2);
						playerProxy.spend("rock", 3);
					}

					playerProxy.deployUnit("city");
					
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

	function isIntersectPlaceable(playerProxy, unitType, intersectX, intersectY) {

		if (isIntersectionOccupied(intersectX, intersectY))
			return false;
		
		if (app.gamePlayMachine.currentGamePhase.data.name === "placement") {
			if (notAlreadyPlacedUnits())
				return true;
		}
		else {
			if (canAffordPurchase(playerProxy, unitType))
				return true;
		}
	}

	function isRoadPlaceable(playerProxy, unitType, intersectX, intersectY) {
	
		if (isRoadOccupied(intersectX, intersectY))
			return false;
		
		if (app.gamePlayMachine.currentGamePhase.data.name === "placement") {
			if (notAlreadyPlacedUnits())
				return true;
		}
		else {
			if (canAffordPurchase(playerProxy, unitType))
				return true;
		}
	}

	function notAlreadyPlacedUnits() {

		return true;
	}

	function canAffordPurchase(playerProxy, unitType) {


	}

	function isIntersectionOccupied(x, y) {
		return false;
	}

	function isRoadOccupied(x, y) {
		return false;
	}

	function Controller_OnStartGame() {

		$("#dice-pan").show();
		$("#gameBoardContainer").show();
		$("#player-container").hide();

		// Don't allow game to be started more than once
		if (app.gamePhaseStatus !== "GAME_STARTED") {
			
			app.gamePhaseStatus = "GAME_STARTED";

			app.gamePlayMachine.Start();
			
			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer.data);

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

		var playerModel = app.playerList.get(player.get("id"));

		return {
			name: player.get("name"),
			color: player.get("color"),
			points: player.get("point"),
			purchasedItems: player.get("purchasedItems"),
			resources: player.get("resources"),
			deployUnit: function(type) {

				playerModel.deployPurchase(type);
			},
			spend: function(type, quantity) {
				
				playerModel.spend(type, quantity);
			},
			addPurchase: function(type) {

				playerModel.addPurchase(type);
			}
		};
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
		Controller : Controller,
		GetPlayerProxy: GetPlayerProxy
	};

})();