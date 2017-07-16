var app = app || {};

app.Utility = (function() {

	var Distance = function(fromX, fromY, toX, toY) {
		
		var aSqr = Math.pow(fromX - toX, 2);
		var bSqr = Math.pow(fromY - toY, 2);
	
		var c = Math.sqrt(aSqr + bSqr);
	
		return c;
	};
	
	var GetXYatArcEnd = function(c1,c2,radius,angle) {
		
		return [c1+Math.cos(angle)*radius,c2+Math.sin(angle)*radius];
	};
	
	var NewGuid = function() {

		var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});     

		return guid;
	};

    return {
        Distance : Distance,
        GetXYatArcEnd : GetXYatArcEnd,
		NewGuid : NewGuid
    }
})();