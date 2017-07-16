var app = app || {};

app.HexBuilder = (function() {

    function HexBuilder() {}

    function HexBuilder_BuildHex(hexId, hexInfo, arcEndX, arcEndY, kineticLayer) {

		var numPiece;
		
		if (hexInfo.type == "desert")
		{
			numPiece = app.createZeroPiece();
			createTheHex();
		}
		else
		{
			numPiece = app.nextNumPiece();
			createTheHex();
			createTheNumber();
		}
		
		function createTheHex() {
			
			app.ring[hexId] = new Kinetic.RegularPolygon({
				x: arcEndX,
				y: arcEndY,
				sides: 6,
				radius: app.GameBoardHexRadius,
				//fill: hexInfo.color,
				fillPatternImage: hexInfo.image,
				fillPatternOffset: [-78, 70],
				hexType: hexInfo.type,
				hexNumber: numPiece.value,
				stroke: 'black',
				strokeWidth: 1,
				id: hexId
			});
			
			app.ringText[hexId] = new Kinetic.Text({
				x: arcEndX - 12,
				y: arcEndY + 14,
				text: hexId,
				fontSize: 25,
				fontFamily: 'Calibri',
				fill: 'blue',
			});

			app.ringText[hexId].hide();
			
			kineticLayer.add(app.ring[hexId]);
			kineticLayer.add(app.ringText[hexId]);
		}

		function createTheNumber() {
			
			app.hexNumbers[hexId] = new Kinetic.Circle({
				x: arcEndX,
				y: arcEndY,
				radius: 15,
				fill: '#EAE0C8', // Pearl
				stroke: 'black',
				strokeWidth: 1,
				id: hexId
			});
			
			app.hexNumbersText[hexId] = new Kinetic.Text({
				x: arcEndX - 7,
				y: arcEndY - 11,
				text: numPiece.value,
				fontSize: 20,
				fontFamily: 'Calibri',
				fill: numPiece.color,
			});
			
			kineticLayer.add(app.hexNumbers[hexId]);
			kineticLayer.add(app.hexNumbersText[hexId]);	
		}
    }

	function HexBuilder_BuildOceanHex(hexId, hexInfo, arcEndX, arcEndY, kineticLayer) {

		app.ring[hexId] = new Kinetic.RegularPolygon({
			x: arcEndX,
			y: arcEndY,
			sides: 6,
			radius: app.GameBoardHexRadius,
			fill: hexInfo.color,
			stroke: 'black',
			strokeWidth: 1,
			id: hexId
		});
		
		kineticLayer.add(app.ring[hexId]);
	}

    HexBuilder.prototype.BuildHex = HexBuilder_BuildHex;
	HexBuilder.prototype.BuildOceanHex = HexBuilder_BuildOceanHex;
	
    return {
        HexBuilder : HexBuilder
    };
})();