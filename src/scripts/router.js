var Router = (function() {

	var init = function() {
	
		//--------------
		// Routers
		//--------------

		app.Router = Backbone.Router.extend({
			routes: {
				'*filter' : 'setFilter'
			},
			setFilter: function(params) {
				if (params)
				{ 
					console.log('app.router.params = ' + params);
					window.filter = params.trim();
				}
				else
				{
					window.filter = '';
				}

				app.playerList.trigger('reset');
				app.hexIntersectList.trigger('showIntersections');
			}
		});     
	};
	
	return {init: init };
	
}());