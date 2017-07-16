var app = app || {};

app.ControlPanelController = (function() {

    function Controller() {}

    function Controller_OnActivePlayerChange(playerProxy) {

        var playerLabel = $("<span>", {
            style: "color:" + playerProxy["color"] + ";",
            html: "Active Player: " + playerProxy["name"]
        });

        var itemsLabel = $("<label>", {html: "Purchased Items: "});
        var resourcesLabel = $("<label>", {html: "Resources: "});
        var propertiesDiv = $("#active-player-properties");

        propertiesDiv.empty();

        propertiesDiv.append(playerLabel);
        propertiesDiv.append("<br>");
        propertiesDiv.append(itemsLabel);
        propertiesDiv.append("<br>");
        
        var items = playerProxy["purchasedItems"];

        for (var i in items) {

            propertiesDiv.append("<span>" + i + ": " + items[i] + "</span><br>");
        }

        propertiesDiv.append(resourcesLabel);
        propertiesDiv.append("<br>");

        var resources = playerProxy["resources"];

        for (var r in resources) {

            propertiesDiv.append("<span>" + r + ": " + resources[r] + "</span><br>");
        }

    }

    Controller.prototype.OnActivePlayerChange = Controller_OnActivePlayerChange;
    
    return {
		Controller : Controller
	};

})();