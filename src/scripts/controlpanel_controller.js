var app = app || {};

app.ControlPanelController = (function() {

    function Controller() {

        var currentPlayerProxy;

        this.setCurrentPlayer = function(playerProxy) {
            currentPlayerProxy = playerProxy;
        }

        this.getCurrentPlayer = function() {
            return currentPlayerProxy;
        }
    }

    function Controller_OnWin(message) {

        var spaShellFoot = $(".spa-shell-foot");

        spaShellFoot.prepend($("<strong>", {html: message}));
    }

    function Controller_OnActivePlayerChange(playerProxy) {

        this.setCurrentPlayer(playerProxy);

        var propertiesDiv = $("#active-player-properties");

        populatePropertiesPane(propertiesDiv, this.getCurrentPlayer());
    }

    function populatePropertiesPane(propertiesDiv, playerProxy) {

        var playerLabel = $("<span>", {
            style: "color:" + playerProxy["color"] + ";",
            html: "Active Player: " + playerProxy["name"]
        });

        var itemsLabel = $("<label>", {html: "Purchased Items: "});
        var resourcesLabel = $("<label>", {html: "Resources: "});

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

    function Controller_Refresh(playerProxy) {

        this.OnActivePlayerChange(playerProxy);
    }

    Controller.prototype.OnActivePlayerChange = Controller_OnActivePlayerChange;
    Controller.prototype.OnWin = Controller_OnWin;
    Controller.prototype.Refresh = Controller_Refresh;
    
    return {
		Controller : Controller
	};

})();