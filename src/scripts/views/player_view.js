
var PlayerView = (function() {

	var initView = function() {
		
		// renders individual player items list (li)
		app.PlayerView = Backbone.View.extend({
			tagName: 'li',
			template: _.template($('#item-template').html()),
			render: function(){
			this.$el.html(this.template(this.model.toJSON()));
				this.input = this.$('.edit');
				return this; // enable chained calls
			},
			initialize: function(){
				this.model.on('change', this.render, this);
			},      
			events: {
				'keypress .edit' : 'updateOnEnter',
				'click .destroy': 'destroy',
				'click .addPoint': 'addPoint',
				'click .addResource': 'addResource',
				'click .selectColor': 'setColor'
			},
			updateOnEnter: function(e){
				if(e.which == 13){
					this.close();
				}
			},
			destroy: function(){
				this.model.destroy();
				app.playerList.trigger('reset');
			},
			addPoint: function(){
				this.model.addPoint();
			},
			addResource: function(e){
				
				this.model.addResource($(e.target).attr("value"));
			},
			setColor: function(e){
				this.model.setColor($(e.target).attr("value"));
			}
			
		});
	}
	
	return { initView: initView};
}());
