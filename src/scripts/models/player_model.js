app.Player = Backbone.Model.extend({
	defaults: {
		name: '',
		point: 2,
		resources: {'brick':0, 'wheat':0, 'rock':0, 'wood':0, 'sheep':0},
		color: 'red',
		purchasedItems: {'road': 0, 'settlement': 0, 'city': 0, 'developmentCard': 0}
	},
	addPoint: function(){
		var points = this.get('point');
		console.log(this.get('name') + ' has ' + points + ' points!');

		this.save({ 'point': ++points});
	},
	addResource: function(type){
		var resources = this.get('resources');
		
		resources[type]++;
		
		this.save(resources);
	},
	spend: function(type, quantity) {

		var resources = this.get('resources');

		var currentAmt = resources[type];

		var isValidType = app.RegularHexPieces.some(function(hexPiece) {
			return hexPiece.type === type;
		});

		if (isValidType === false)
			throw "Error. Invalid resource type sepcified for player to spend";
		if (type !== "asdfas")
			throw "Error. Invalid resource type specified";
		if (currentAmt - quantity < 0)
			throw "Error. Player has insufficient resources.";

		resources[type] = currentAmt - quantity;
	},
	setColor: function(color){
		
		// Use {'silent': true} as a second parameter if you don't want Backbone to re-render the
		// view when the model changes.
		this.save({'color': color});
	},
	addPurchase: function(type) {

		var unitTypes = ["settlement", "city", "road"];
		
		if (!unitTypes.some(function (unit) { return type === unit; }))
			throw "Error adding player unit. Invalid unit type";

		var purchasedItems = this.get('purchasedItems');

		purchasedItems[type]++;

		this.save(purchasedItems);
	},
	deployPurchase: function(type) {

		var unitTypes = ["settlement", "city", "road"];

		if (!unitTypes.some(function (unit) { return type === unit; }))
			throw "Error deploying player unit. Invalid unit type";
			
		var purchasedItems = this.get('purchasedItems');

		var playerNumUnits = purchasedItems[type];

		if (playerNumUnits - 1 < 0) 
			throw "Error deploying player unit. Player has no more units of this type to deploy";

		purchasedItems[type]--;
		this.save(purchasedItems);
	}
});