var IntersectionModel = (function() {

	var initModel = function() {
	
		app.IntersectionModel = Backbone.Model.extend({
			defaults: {
				id: '',
				x: '',
				y: ''
			},
			addAdjacentHex: function(hexId){
				this.adjacentHexes.push(hexId);
			},
			highlightOnBoard: function(){
			
				app.vertices[this.id].setStroke("yellow");
				app.vertices[this.id].setStrokeWidth(3);
				app.vertices[this.id].draw();
			},
			alertAdjacencies: function() {
			
				var adjacentHexes = app.intersectToHexesAdjacency[this.id];
				
				var stringListOfHexes = "";
				
				for(var i=0; i<adjacentHexes.length; i++)
				{
					stringListOfHexes+= (adjacentHexes[i] + ",");
				}
				
				var stringAdjacentIntersects = "";
				
				var adjancentIntersections = app.intersectToIntersectAdjacency[this.id];
				
				for (var i=0; i < adjancentIntersections.length; i++)
				{
					stringAdjacentIntersects+= (adjancentIntersections[i] + ",");
				}
				
				//alert("adjacent to hex #: " + stringListOfHexes + " adjacent to intersections: " + stringAdjacentIntersects);
				
			}
		});
	};
	
	return {initModel: initModel};
	
}());