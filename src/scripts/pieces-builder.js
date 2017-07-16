var app = app || {};

app.Pieces = (function() {

	function PiecesBuilder() {

	}

	function PiecesBuilder_MakeSettlement(x,y,r,color,layer) {

		var settlement = {};
	
		var frontRadius = r;
		var frontY = y;
		
		settlement.front = makeBlock(x,frontY,frontRadius,color);

		var roofY = frontY - frontRadius/(Math.sqrt(2));
		var roofRadius = frontRadius/(Math.sqrt(2));

		settlement.front.rotateDeg(45);

		settlement.roof = makeBlock(x,roofY,roofRadius,color);

		layer.add(settlement.roof);
		layer.add(settlement.front);
	}
	
	function PiecesBuilder_MakeCity(x,y,r,color,kineticLayer) {

		var city = {};
		
		// Center the city in the x direction
		var xOffset = x + r/Math.sqrt(2);
		
		city.center = makeBlock(xOffset,y,r,color);
		
		city.settlement = this.MakeSettlement(xOffset,y-(.5*r),r,color,kineticLayer);

		var sideRadius = r;
		var sideY = y;
		var sideX = xOffset - 2*(r/Math.sqrt(2));
		
		city.side = makeBlock(sideX,sideY,sideRadius,color);
		
		city.center.rotateDeg(45);
		city.side.rotateDeg(45);
		
		kineticLayer.add(city.center);
		kineticLayer.add(city.side);
	}

	function PiecesBuilder_MakeRoad(x,y,length,color,theta) {
		
		var w = length;
		var h = 7;
		
		var block = makeRectangle(x,y,w,h,color);
		
		block.rotate(theta);
		
		return block;
	}

	PiecesBuilder.prototype.MakeCity = PiecesBuilder_MakeCity;
	PiecesBuilder.prototype.MakeSettlement = PiecesBuilder_MakeSettlement;
	PiecesBuilder.prototype.MakeRoad = PiecesBuilder_MakeRoad;

	function makeBlock(x,y,r,color){

		var block = new Kinetic.RegularPolygon({
			x: x,
			y: y,
			sides: 4,
			radius: r,
			fill: color,
			//fillPatternImage: theCenter.image,
			//fillPatternOffset: [-78, 70],
			//hexType: theCenter.type,
			stroke: 'black',
			strokeWidth: 1,
			//id: centerGuid
		});
		
		return block;
	}

	function makeRectangle(rectX,rectY,w,h,color) {
		
		var rect = new Kinetic.Rect({
			x: rectX,
			y: rectY,
			width: w,
			height: h,
			fill: color,
			stroke: 'black',
			strokeWidth: 1
		});
		
		rect.rotation = 0;
		
		return rect;
	}

	return {
		PiecesBuilder : PiecesBuilder
	};

})();