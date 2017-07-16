var CatanHexView = (function() {

	var initView = function() {
	
		app.CatanHexView = Backbone.View.extend({
			tagName: 'gameBoardContainer',
			render: function(){
				
			},
			initialize: function(){
				
				this.model.hex.on('click', this.hexClick);
			},      
			events: {
			
			},
			hexClick: function(e){

				if (this.selected == true)
				{
					this.setStroke("black");
					this.setStrokeWidth("1");
					this.draw();

					this.selected = false;
				}
				else
				{

					this.setStroke("blue");
					this.setStrokeWidth("3");
					this.draw();

					this.selected = true;
				}
			},
			selected: false

		});
	};
	
	return {initView: initView };
	
}());