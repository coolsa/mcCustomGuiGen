//so this measures the image dimensions of the inventory that you are making
//make sure that its square and stuff.
//and the pixel pos measures the top right corner of the spot where you want to center it.
//eg this centers the top right corner of the default double chest image on the top right item.
var dimensions = [256,256]
var pixelPos = [24,18]

//so the widht and height are of the inv image to use
//and the offsets are for the top right corner of where the item is.

function rotate(xPoint,yPoint,xOrigin,yOrigin,deg){
  var rad = deg*(Math.PI / 180)
  return [(((xPoint-xOrigin)*Math.cos(rad))-((yPoint-yOrigin)*Math.sin(rad)))+xOrigin,(((xPoint-xOrigin)*Math.sin(rad))+((yPoint-yOrigin)*Math.cos(rad)))+yOrigin]
}

//this defaults for the top right corner of the item, with its scaling and all.
function findOutPos(posPivot, scaling=[4,4,4], xWidth=32-16,yWidth=32/Math.cos(45*(Math.PI / 180))-16,zWidth=-16, xCenter=8,yCenter=8,zCenter=8){
  //so the widths basically defines the size of the image. this is the default im using
  //can be chaged through other things though.
  //the widths are between -16 and 32, top right corner something something.
  //this is the initial, controllable, rotation.
  var pos = rotate(xWidth,yWidth,posPivot[0],posPivot[1],-22.5);
  //everything below is centered on 8,8,8. below is scaling
  pos[0] = (pos[0]-xCenter)*scaling[0]+(xCenter);
  pos[1] = (pos[1]-xCenter)*scaling[1]+(yCenter);
  zWidth = (zWidth-zCenter)*scaling[2]+(zCenter);
  //then z rotation, followed by y rotation.
  var pos = rotate(pos[0],pos[1],xCenter,yCenter,22.5);
  [pos[1],pos[2]]=rotate(pos[1],zWidth,yCenter,zCenter,-45);
	return([pos[0],pos[1]]);
}
//this gets the top corner in relation to the zero zero (bottom left corner of item.)
//now to invert it.
//image pos is default top right corner.
function revertPos(pos, scaling=[4,4,4], imagePos = [32-16,32/Math.cos(45*(Math.PI / 180))-16],zWidth=-16, xCenter=8,yCenter=8,zCenter=8){
  //preserve passed arrays.
  pos=pos.slice();
  imagePos=imagePos.slice();
  var originalPos = pos.slice();
  var rad = -45*(Math.PI / 180);
  //get the z coordinate again, to undo the final 45 degree translation with some quick maths.
  zWidth = (zWidth-zCenter)*scaling[2]+(zCenter);
  pos[1] = (((pos[1]-yCenter)+(zWidth-zCenter)*Math.sin(rad))/Math.cos(rad))+yCenter; //this is what zOffset is now. code is corrected!
  //undo the 22.5 degree translation.
  var pos = rotate(pos[0],pos[1],xCenter,yCenter,-22.5);
  //undo the scaling.
  pos[0] = (pos[0]-xCenter)/scaling[0]+(xCenter);
  pos[1] = (pos[1]-xCenter)/scaling[1]+(yCenter);
  //find the pivot point, the whole point of these steps.
  var pos=revertRotationXZ(pos,imagePos,-22.5);
  return(pos);
}
//this takes two positions, starting and ending, and finds the center pivot point.
function findAB(posStart,posEnd, angle){
  //start off with a conversion into radians.
  var angle = angle*(Math.PI / 180)
  //for actually getting the value, im using the math from this stackexchange gemoetry post.
  //https://math.stackexchange.com/questions/27535/how-to-find-center-of-an-arc-given-start-point-end-point-radius-and-arc-direc

  //clockwise or counterclockwise.
  var direction = Math.abs(angle)/angle
  //then the distance between the two points.
  var distance = (((posStart[0]-posEnd[0])**2)+((posStart[1]-posEnd[1])**2))**(1/2)
  //the center between these points.
  var midpoint = [((posStart[0]+posEnd[0])/2),((posStart[1]+posEnd[1])/2)]
  //the distance to the center point.
  var toCenter= distance/(2*Math.tan(angle/2))
  //this is the unit normal.
  var normal = [((posEnd[0]-posStart[0])/distance),((posEnd[1]-posStart[1])/distance)]
  //and finally return the center points.
  return([midpoint[0]-(toCenter*normal[1])*direction,midpoint[1]+(toCenter*normal[0])*direction])
}




//The math behind this is just a simple rotation matrix, that I did some linear algebra on and used symbolab to solve for the x and y origin, math is better explained in the notes, messy as they are.
function revertRotationXZ(posStart,posEnd,angle){
	angle *= (Math.PI/180);
	return([((posStart[1]-posEnd[1])*Math.sin(angle)+(posStart[0]+posEnd[0])*(1-Math.cos(angle)))/((Math.sin(angle))**2+(1-Math.cos(angle))**2),((posEnd[0]-posStart[0])*Math.sin(angle)+(posStart[1]+posEnd[1])*(1-Math.cos(angle)))/((Math.sin(angle))**2+(1-Math.cos(angle))**2)])
}

//this is a simple rotation matrix, the one for x and z axis rotations works out to be the same math. nifty keen, jelly bean.
function rotationXZ(posStart,origin,angle){
    angle *= (Math.PI/180);
    return([Math.cos(angle)*(posStart[0]-origin[0])-Math.sin(angle)*(posStart[1]-origin[1])+origin[0],Math.sin(angle)*(posStart[0]-origin[0])+Math.cos(angle)*(posStart[1]-origin[1])+origin[1]]);
}
var shift = [0,0,-80];
//this just reverses the original operations, which would be a rotation, then another, then another, then a scale. so just reverse that yo
function findStartValues(targetPos=[8,8,8],startPos=[8,8,8],scale=[1,1,0.0000001],firstTime=false,origin=[8,8,8],zAxisAngle=22.5,xAxisAngle=45){
	//nothing screams good code like a do while loop, that just shuts down after 50000 times, yknow?
	var loops=0;
	do{
		endPos = targetPos.slice();
		endPos = [(endPos[0]-origin[0])/scale[0]+origin[0],(endPos[1]-origin[1])/scale[1]+origin[1],(endPos[2]-origin[2])/scale[2]+origin[2]];
		[endPos[1],endPos[2]]=rotationXZ([endPos[1],endPos[2]],origin,xAxisAngle);
		[endPos[0],endPos[1]]=rotationXZ([endPos[0],endPos[1]],origin,zAxisAngle);
		[endPos[0],endPos[1]]=revertRotationXZ(endPos,startPos,-zAxisAngle);
		if(endPos[2]<-400){
			if(firstTime&&endPos[2]>-350)return endPos;
			else{
				//do something here
			}
		}else if(endPos[2]>-16){
		}
		return endPos;
	}while(firstTime&&loops>100000)
	throw "error! no positions found!"
}

//this is a function that ill put into a JSON stringify, fancy dancy stuff...
function outputElement(startPos=[8,8,8],endPos=[8,8,8],scale=[1,1,1],firstTime=false,uvArea=[0,0,8,8],imageMin=[0,-3.313708499,-16],imageMax=[16,19.3137085,8]){
	var origin = findStartValues(endPos.slice(),startPos.slice(),scale,firstTime)
	return {
		from:imageMin,
		to:imageMax,
		faces:{south:{uv:uvArea,texture:"#gui"}},
		rotation:{
			origin:origin,
			axis:"z",
			angle:22.5
		}};
}

//this should return 4 different positions, for each of the four corners.
function displayToItemPos(dimensions=[256,256], invPos=[0,0], toPos= [16,16], imageDim=[32,32/Math.cos(45*(Math.PI / 180))], ) {
  var quarterDim=[dimensions[0]/2,dimensions[1]/2]
  var adjustedPos = [invPos[0],(dimensions[1]-invPos[1])-quarterDim[1]]
  //get the point that it will be at originally,
  var itemPos = [adjustedPos[0]*(imageDim[0]/quarterDim[0])-16,adjustedPos[1]*(imageDim[1]/quarterDim[1])-16]
//  console.log(revertPos(toPos,itemPos))
  //this just shifts around the position of the thing, so it all renders well.
  var scaling = [4,4,0.00000001]
  return [revertPos(toPos,scaling,itemPos),revertPos([toPos[0]+128,toPos[1]],scaling,itemPos),revertPos([toPos[0],toPos[1]-128],scaling,itemPos),revertPos([toPos[0]+128,toPos[1]-128],scaling,itemPos)]
}
function outputEverthing(positions=[[0,0],[0,0],[0,0],[0,0]],image="custom_gui/example",offset=-80,imageSize=[32,32/Math.cos(45*(Math.PI / 180)),0]){
  var outPos = (imageSize[0]-16) + ', ' + (imageSize[1]-16) + ', ' + (imageSize[2]-16) //prep this out positioning. basically that image size thing.
  //then the very nicely formatted output here.
  var output = [
  '{',
  '  "textures": {',
  '    "gui": "'+image+'"',
  '  },',
  '  "elements": [',
  '    {',
  '      "from": [ -16, -16, -16 ],',
  '      "to": [ ' + outPos + ' ],',
  '      "rotation": {',
  '        "origin":[ '+positions[0].toString()+', 0],',
  '        "axis":"z",',
  '        "angle":-22.5',
  '      },',
  '     "faces": {',
  '        "south": { "uv": [ 0, 0, 8, 8 ], "texture": "#gui"}',
  '      }',
  '    },',
  '    {',
  '      "from": [ -16, -16, -16 ],',
  '      "to": [ ' + outPos + ' ],',
  '      "rotation": {',
  '         "origin":[ '+positions[1].toString()+', 0],',
  '         "axis":"z",',
  '         "angle":-22.5',
  '      },',
  '      "faces": {',
  '          "south": { "uv": [ 8, 0, 16, 8 ], "texture": "#gui"}',
  '        }',
  '    },',
  '    {',
  '      "from": [ -16, -16, -16 ],',
  '      "to": [ ' + outPos + ' ],',
  '      "rotation": {',
  '        "origin":[ '+positions[2].toString()+', 0],',
  '        "axis":"z",',
  '        "angle":-22.5',
  '      },',
  '      "faces": {',
  '        "south": { "uv": [ 0, 8, 8, 16 ], "texture": "#gui"}',
  '      }',
  '    },',
  '    {',
  '      "from": [ -16, -16, -16 ],',
  '      "to": [ ' + outPos + ' ],',
  '      "rotation": {',
  '         "origin":[ '+positions[3].toString()+', 0],',
  '         "axis":"z",',
  '         "angle":-22.5',
  '      },',
  '      "faces": {',
  '        "south": { "uv": [ 8, 8, 16, 16 ], "texture": "#gui"}',
  '      }',
  '    }',
  '  ],',
  '  "display": {',
  '    "gui": {',
  '      "rotation": [ -45, 0, 22.5 ],',
  '      "scale": [ 4, 4, 4 ],',
  '      "translation": [ 0, 0, ' + offset + ' ]',
  '    }',
  '  }',
  '}'].join('\n')
  return output
}
//and this is everything to get the outputted item file, very very fancy.
function generate(){
  var dimensions = [document.getElementsByClassName("inputSize")[0].children[1].value,document.getElementsByClassName("inputSize")[0].children[2].value]
  var pixelPos = [document.getElementsByClassName("inputPos")[0].children[1].value,document.getElementsByClassName("inputPos")[0].children[2].value]
  document.getElementsByClassName("output")[0].children[0].innerText = outputEverthing(displayToItemPos(dimensions,pixelPos),document.getElementsByClassName("inputName")[0].children[1].value,256*(pixelPos[1]/dimensions[1]-108/256)+4);
}
