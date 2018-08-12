var IntersectionModel = (function() {

    var initModel = function() {
    
        app.IntersectionModel = Backbone.Model.extend({
            defaults: {
                id: '',
                x: '',
                y: '',
                occupyingPiece: ''
            },
            addAdjacentHex: function(hexId){
                this.adjacentHexes.push(hexId);
            },
            highlightOnBoard: function(){
            
                var vertex = app.Proxies.BoardVertices().getVertexProxy(this.id);
                vertex.highlightOnBoard();
                vertex.getVertex().draw();
            },
            isOccupiedByPlayer: function(playerId) {
                
                console.log("Checking if occupied by player: " + playerId);

                var piece = this.get('occupyingPiece');

                if (piece && piece.playerId === playerId) {
                    console.log("Cofirmed occupied by player: " + playerId);
                
                    return true;
                }

                console.log("Occupied by: " + piece.playerId);

                return false;
            },
            isOccupied: function() {

                var piece = this.get('occupyingPiece');

                if (piece && piece.type) {
                    return true;
                }

                return false;
            },
            getOccupyingPiece: function() {

                return this.get('occupyingPiece');
            },
            setOccupyingPiece: function(piece) {
                
                this.set('occupyingPiece', piece);
                console.log('NEW INTERSECTION PLACEHOLDER...occupyigPiece set to:' + JSON.stringify(this.get('occupyingPiece')));
            },
            alertAdjacencies: function() {
            
            }
        });
    };
    
    return {initModel: initModel};
    
}());