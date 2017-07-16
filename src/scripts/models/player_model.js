app.Player = Backbone.Model.extend({
	defaults: {
		name: '',
		point: 2,
		resources: {'brick':0, 'wheat':0, 'rock':0, 'wood':0, 'sheep':0},
		color: 'red',
		purchasedItems: {'road': 2, 'settlement': 2, 'city': 0, 'developmentCard': 0}
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
	setColor: function(color){
		
		// Use {'silent': true} as a second parameter if you don't want Backbone to re-render the
		// view when the model changes.
		this.save({'color': color});
	},
	addPurchase: function(type) {
		var purchasedItems = this.get('purchasedItems');

		purchasedItems[type]++;

		this.save(purchasedItems);
	},
	deployPurchase: function(type) {

		var purchasedItems = this.get('purchasedItems');

		purchasedItems[type]--;

		this.save(purchasedItems);
	}
});