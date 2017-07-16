var IntersectionView = (function() {
	
	var initView = function () {
		
		app.IntersectionView = Backbone.View.extend({
			tagName: 'li',
			template: _.template($('#intersect-template').html()),
			render: function(){
				this.$el.html(this.template(this.model.toJSON()));
				return this; // enable chained calls
			},
			initialize: function(){
				this.model.on('change', this.render, this);
			},
			events: {
				'click .highlight': 'highlight'
			},
			highlight: function(e){
			this.model.highlightOnBoard();
			this.model.alertAdjacencies();
			}
		});

	};
	
	return {initView: initView };
	
}());