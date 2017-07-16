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

			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer);

			app.controlPanelController.OnActivePlayerChange(playerProxy);
		});

		$("#nextGamePhase").on("click", function() {

			app.gamePlayMachine.NextGamePhase();

			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer);
			
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
			
			var currentPlayer = app.gamePlayMachine.GetCurrentPlayer();

			// TODO: Use "global" road length
			var road = piecesBuilder.MakeRoad(this.attrs.roadX, this.attrs.roadY, 20, currentPlayer["color"], this.attrs.angle);
			
			app.kineticLayer.add(road);
			app.kineticLayer.draw();
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
			
			var playerProxy = app.GameBoardController.GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer);

			var itemDrawColor = playerProxy["color"];

			settlement.on("click", function() {
				piecesBuilder.MakeSettlement(intersectX, intersectY, 10, itemDrawColor, app.kineticLayer);
				app.kineticLayer.draw();
			});
			
			var city = $("<button>", {
				"class": "city-btn",
				"text": "City"
			});
			
			city.on("click", function() {
				piecesBuilder.MakeCity(intersectX, intersectY, 10, itemDrawColor, app.kineticLayer);
				app.kineticLayer.draw();
			});
			
			$("#selectedIntersect").html("Selected Intersection: <br> Id: " + intersectId + "<br>" +
				"Adjacent Hexes: " + app.intersectToHexesAdjacency[intersectionId] + "<br>" +
				"Adjacent Intersections: " + app.intersectToIntersectAdjacency[intersectionId] + "<br>");
			
			$("#selectedIntersect").append(settlement, city);
		
		});
	};

	function Controller_OnStartGame() {

		$("#dice-pan").show();
		$("#gameBoardContainer").show();
		$("#player-container").hide();

		// Don't allow game to be started more than once
		if (app.gamePhaseStatus !== "GAME_STARTED") {
			
			app.gamePhaseStatus = "GAME_STARTED";

			app.gamePlayMachine.Start();
			
			var playerProxy = GetPlayerProxy(app.gamePlayMachine.currentTurnPlayer);

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

		return {
			name: player.data.get("name"),
			color: player.data.get("color"),
			points: player.data.get("point"),
			purchasedItems: player.data.get("purchasedItems"),
			resources: player.data.get("resources")
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