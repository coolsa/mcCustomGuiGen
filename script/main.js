//The math behind this is just a simple rotation matrix, that I did some linear algebra and used symbolab to solve for the x and y origin, math is basically this:
/* todo: fill this in.*/
function revertRotationXZ(posStart,posEnd,angle){
	angle *= (Math.PI/180);
	return([((posStart[1]-posEnd[1])*Math.sin(angle)+(posStart[0]+posEnd[0])*(1-Math.cos(angle)))/((Math.sin(angle))**2+(1-Math.cos(angle))**2),((posEnd[0]-posStart[0])*Math.sin(angle)+(posStart[1]+posEnd[1])*(1-Math.cos(angle)))/((Math.sin(angle))**2+(1-Math.cos(angle))**2)])
}

//this is a simple rotation matrix, the one for x and z axis rotations works out to be the same math. nifty keen, jelly bean. see above for the math behind it.
function rotationXZ(posStart,origin,angle){
    angle *= (Math.PI/180);
    return([Math.cos(angle)*(posStart[0]-origin[0])-Math.sin(angle)*(posStart[1]-origin[1])+origin[0],Math.sin(angle)*(posStart[0]-origin[0])+Math.cos(angle)*(posStart[1]-origin[1])+origin[1]]);
}
//this just reverses the original operations, which would be a rotation, then another, then another, then a scale. so just reverse that yo
function findStartValues(targetPos=[8,8,8],startPos=[8,8,8],scale=[1,1,1],shift=[0,0,0],origin=[8,8,8],zAxisAngle=22.5,xAxisAngle=45){
	//nothing screams good code like a do while loop, that just shuts down after 50000 times, yknow?
	var loops=0;
	targetPos[2]=startPos[2];
	targetPos.forEach(function(val,pos,arr){arr[pos]=(val-origin[pos])/scale[pos]+origin[pos]});
	endPos = targetPos.slice();
	beginningPos = startPos.slice();
	var sorter=12;
	var specialZ=0,specialY=0,specialPos=[0,0];
	while(true){
		//oh ok, so basically there was some math relationship to the rotation matrix, i reverted to solve for the z starting position, however there was some complications with it. from there, I basically had to guess and check to solve for the scaling multiplication, but i guess it makes sense???? I have yet to test the scaling, but i know everything works with 4,4,4, so who cares lol.
		specialZ=(Math.sin(xAxisAngle*(Math.PI/180))*(beginningPos[2]-origin[2])*scale[2]/scale[1]);
		specialY= (((endPos[1]-origin[1])-specialZ)/Math.cos(xAxisAngle*(Math.PI/180))+origin[1]);
		specialPos=rotationXZ([specialY,beginningPos[2]+shift[2]],origin,-xAxisAngle) //this just reverts to find original z, which is [1]
		if(specialPos[1]>-8){ //basically trying to center starting z on the -8,-8 Z position, as thats somehow the best spot??? kinda guess and check
			beginningPos[2]-=sorter;
		}
		else if(specialPos[1]<-8){
			beginningPos[2]+=sorter;
		}
		sorter/=2;
		if(loops++>54) {
			if(specialPos[1]<=16&&specialPos[1]>=-32) break; //if the original z is actually possible on the thing, goooood stuff. it works.
			else throw "error! no positions found! best endPos: "+endPos+". best beginningPos: "+beginningPos; //else error.
		}
	} //this loop runs until the z is in a good spot, and uses specialY as the Y unrotated-by--45-on-x-axis y value
	endPos[1]=specialY; //then, with the undone Y, plug that bad boi in.
	[endPos[0],endPos[1]]=rotationXZ([endPos[0],endPos[1]],origin,zAxisAngle); //solve for more x and y values.
	//console.log(beginningPos,endPos);
	[beginningPos[0],beginningPos[1]]=revertRotationXZ(beginningPos,endPos,zAxisAngle); //solve for the final values! (for this part)
	//console.log(beginningPos,endPos);
	return beginningPos;
}

//this is a function that ill put into a JSON stringify, fancy dancy stuff...
function outputElement(startPos=[8,8,8],endPos=[8,8,8],scale=[1,1,1],uvArea=[0,0,8,8],imageMin=[0,-3.313708499,8],imageMax=[16,19.3137085,8],shift=[0,0,0]){
	var origin = findStartValues(endPos.slice(),startPos.slice(),scale,shift)
	//i heckin love JSON.stringify. this makes that old mess into a simple thing.
	return {
		from:imageMin,
		to:[imageMax[0],imageMax[1],origin[2]],
		faces:{south:{uv:uvArea,texture:"#gui"}},
		rotation:{
			origin:origin,
			axis:"z",
			angle:22.5
		}};
}

function outputAllElements(topLeftEnd=[0,0],imageName="example/inventory",imageDims=[256,256],imageParts=[4,4],imageStart=[0,0],imageEnd=[256,256],pixelRatio=1,cover=false,scale=[4,4,4],xAxisAngle=45,zAxisAngle=22.5){
	//min image parts is 2,2, but higher numbers are possible.
	//the image parts basically helps to split the uv area up, produce the scale, and then find the item image sizes.
	//pixel ratio is basically the density of pixels, default minecraft is 16x16, but if its 32x32, the ratio of new/old is 2
	//multiply the topLeftEnd imageDims, imageStart, imageEnd by the ratio.
	topLeftEnd.forEach(function(val,pos,arr){arr[pos]=val/pixelRatio});
	imageDims.forEach(function(val,pos,arr){arr[pos]=val/pixelRatio});
	imageStart.forEach(function(val,pos,arr){arr[pos]=val/pixelRatio});
	imageEnd.forEach(function(val,pos,arr){arr[pos]=val/pixelRatio}); //these for forEach just undo the scaling of the image.
	var invSize=[imageEnd[0]-imageStart[0],imageEnd[1]-imageStart[1]] //this is just a frequently used value, nothing more.

	//uvArea is a bit complicated, not really though. just a ration between the image positions and the size, multiplied by 16.
	var uvArea = [16*imageStart[0]/imageDims[0],16*imageStart[1]/imageDims[1],16*imageEnd[0]/imageDims[0],16*imageEnd[1]/imageDims[1]];
	//pieceDimensions should MAX be 48,48, so i that basically winds up being some ration between the size and the parts*scale. i guessed.
	var pieceDimensions=[invSize[0]/(imageParts[0]*scale[0]),invSize[1]/(scale[1]*imageParts[1])];
	if(pieceDimensions[0]>48||pieceDimensions[1]>48) throw "error! bad scaling or too few parts! please re-check your values!";
	//the piece parts are based on the rotation of 45 degrees. when rotated, it becomes size*cos(angle), so just divide by cos(angle) to get better value.
	//then the reason its doing stuff with 8+ or 8- is to center it on the 8,8 position, as thats the center of the item
	var pieceMin=[8-pieceDimensions[0]/2,8-pieceDimensions[1]/(2*Math.cos(xAxisAngle*Math.PI/180)),8];
	var pieceMax=[8+pieceDimensions[0]/2,8+pieceDimensions[1]/(2*Math.cos(xAxisAngle*Math.PI/180)),8];
	//this is the top left corner of the items rendering, so it uses this and finds good spots based on it.
	var topLeftStart=[pieceMin[0],pieceMax[1],8];
	//this just adds 16 to account for the 0,0 position being at the bottom left, and the inputted position being the top right. lol oops.
	topLeftEnd=[topLeftEnd[0]+16,topLeftEnd[1]+16,8];
	var imageElements = []; //this contains all of the elements of the whole thing.
	for(var xPart = 0; xPart < imageParts[0]; xPart++){
		for(var yPart = 0; yPart < imageParts[1]; yPart++){
			//this is the portion of the texture area used in the element.
			var uvPart = [xPart*(uvArea[2]-uvArea[0])/imageParts[0]+uvArea[0],yPart*(uvArea[3]-uvArea[1])/imageParts[1]+uvArea[1],(xPart+1)*(uvArea[2]-uvArea[0])/imageParts[0]+uvArea[0],(yPart+1)*(uvArea[3]-uvArea[1])/imageParts[1]+uvArea[1]];
			//this is where the top-left corner of the item wants to end up.
			var goalPos = [topLeftEnd[0]+invSize[0]*(xPart)/imageParts[0],topLeftEnd[1]-invSize[1]*(yPart)/imageParts[1],8];
			console.log(goalPos,uvPart);
			//this then adds the generated element to the element array.
			imageElements.push(outputElement(topLeftStart,goalPos,scale,uvPart,pieceMin,pieceMax));
		}
	}
	var offset = [0,0,-80]; //this renders under all the items
	if(cover) offset[2]=80; //this renders over all the items.
	//lets put that output in a variable for debug reasons haha yes.
	var output = {textures:{gui:imageName},elements:imageElements,display:{gui:{rotation:[-xAxisAngle,0,-zAxisAngle],scale:scale,translation:offset}}}
	return(output);
}


//and this is everything to get the outputted item file, very very fancy. update: gotta add more parts lol.
function generate(){
  var dimensions = [document.getElementsByClassName("inputSize")[0].children[1].value,document.getElementsByClassName("inputSize")[0].children[2].value]
  var pixelPos = [document.getElementsByClassName("inputPos")[0].children[1].value,document.getElementsByClassName("inputPos")[0].children[2].value]
  document.getElementsByClassName("output")[0].children[0].innerText = outputEverthing(displayToItemPos(dimensions,pixelPos),document.getElementsByClassName("inputName")[0].children[1].value,256*(pixelPos[1]/dimensions[1]-108/256)+4);
}
