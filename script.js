function setup() {
	createCanvas(windowWidth, windowHeight);

	//SETTINGS
	l = 5;                  //space between points
	hitD = l / 3;               //buffer distance between square and end
	testsPerFrame = 42;      //number of square advances per frame
	repeat = false;          //does the square go around multiple times?
	mode = 0;
	mouse = 0;
	start = false;
	drawn = false;
	mouseHeld = false;
	mx = 0;
	my = 0;

  //SIMPLIFICATION TECHNIQUES
  handShake = true;//no redundancy
  changeSquarePoint = false;//changes the point where a square is found
  
  increasePrecision = false;//goes through multiple times with increasing precision and limited overlap
  //0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16
  //X               X                     X
  //  X       X       X          X
  //    X   X   X   X   X     X     X     X
  //X X X X X X X X X X X  X  X  X  X  X  X
  islandSquare = true;//if the far corners cant move to a line with perfect efficiency in X moves, skip X moves and check again
  colorAcuracy = false;


	//Multithread instantiation
	mt = new Multithread(testsPerFrame);

	//LINE SEGMENTS
	sgs = [];

	reset();
}

function draw() {
	background(0);

  noScroll();

  //MOUSE CORDINATES
	fill(255);
  stroke(255);
	text("(" + mouseX + ", " + mouseY + ")", 50, 50);

  //INITIAL DRAW SETUP
	if (!start) {
		if (mouseHeld) {
			if(!drawn) {
        sgs = [];
        squares = [];
      }
      drawn = true;

			if(dist(mx, my, mouseX, mouseY) > 5) {
			  sgs[sgs.length] = new pt(mouseX, mouseY);
        mx = mouseX;
        my = mouseY;
        setL();
			}
		}
		if (!mouseHeld && drawn) {
			reset();
			start = true;

      setL();
		}
	}
	//mx = mouseX;
	//my = mouseY;


	//DRAW SGS
  for (i = 0; i < sgs.length; i++) {
		stroke(255);
		strokeWeight(3);
		line(sgs[i].x, sgs[i].y, sgs[(i + 1) % (sgs.length)].x, sgs[(i + 1) % (sgs.length)].y);
	}
  //DRAW LOADING BAR
  noFill();
  stroke(255);
  strokeWeight(0.75);
  rect(width*1/3, 25, width*1/3, 35);
  fill(0, 200, 0);
  rect(width*1/3, 25, width*1/3*sqrt(e)/sqrt((pts.length-1)), 35);
  fill(255);
  textSize(18);
  text("Squares found: " + squares.length + " / " + int(squares.length*sqrt(pts.length-1)/sqrt(e)+0.5), width/2-70, 48);
  textSize(12);

	//DRAW SUCCESSFULL SQUARES
	for (i = 0; i < squares.length; i++) {
		stroke(0, 255, 0);
		noFill();
		strokeWeight(1);
		quad(squares[i].pa.x, squares[i].pa.y, squares[i].pb.x, squares[i].pb.y, squares[i].pc.x, squares[i].pc.y, squares[i].pd.x, squares[i].pd.y);
	}
  noStroke();
  fill(255);
  if(sgs.length > 0) {
    circle(sgs[0].x, sgs[0].y, 8);
  }

	squareTest();

}

class pt {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class square {
	constructor(pa, pb, pc, pd) {
		this.pa = pa;
		this.pb = pb;
		this.pc = pc;
		this.pd = pd;
	}
}

function keyPressed() {
	if (key == 'r') {
		squares = [];
	}
	if (key == 'p') {
		print(squares.length);
	}
}
function mousePressed() {
	mouseHeld = true;
}
function mouseReleased() {
	mouseHeld = false;
}
function intersect_point(point1, point2, point3, point4) {
	const ua = ((point4[0] - point3[0]) * (point1[1] - point3[1]) -
		(point4[1] - point3[1]) * (point1[0] - point3[0])) /
		((point4[1] - point3[1]) * (point2[0] - point1[0]) -
			(point4[0] - point3[0]) * (point2[1] - point1[1]));

	const ub = ((point2[0] - point1[0]) * (point1[1] - point3[1]) -
		(point2[1] - point1[1]) * (point1[0] - point3[0])) /
		((point4[1] - point3[1]) * (point2[0] - point1[0]) -
			(point4[0] - point3[0]) * (point2[1] - point1[1]));

	const x = point1[0] + ua * (point2[0] - point1[0]);
	const y = point1[1] + ua * (point2[1] - point1[1]);

	return [x, y]
}

function getTheta(ax, ay, bx, by) {
	if (bx - ax >= 0) {
		return atan((by - ay) / (bx - ax));
	} else {
		return atan((by - ay) / (bx - ax)) + PI;
	}
}


// Do the math needed for the square
function squareTest() {
	for (t = 0; t < testsPerFrame && start; t++) {

		//SQUARE TEST
		//create first two diamond points
		let ex = pts[e].x;
		let ey = pts[e].y;
		let fx = pts[f].x;
		let fy = pts[f].y;
		//math
		let squareAngle = getTheta(ex, ey, fx, fy);
		let d = dist(ex, ey, fx, fy);
		//create second two diamond points
		let gx = ex + d / sqrt(2) * cos(squareAngle + PI / 4);
		let gy = ey + d / sqrt(2) * sin(squareAngle + PI / 4);
		let hx = ex + d / sqrt(2) * cos(squareAngle - PI / 4);
		let hy = ey + d / sqrt(2) * sin(squareAngle - PI / 4);
		//draw diamond
		//g f
		//e h
		stroke(0, 0, 255);
		strokeWeight(0.5);
		line(ex, ey, gx, gy);
		line(gx, gy, fx, fy);
		line(fx, fy, hx, hy);
		line(hx, hy, ex, ey);

		//TEST THE BUILT SQUARE
		let gHit = false;
		let hHit = false;

    let minG = 1000;
    let minH = 1000;
    let pG = createVector(gx, gy);
    let pH = createVector(hx, hy);
    
		for (i = 0; i < pts.length; i++) {
      if(islandSquare) {
        let a = createVector(pts[i].x, pts[i].y);
        let b = createVector(pts[(i + 1) % (pts.length)].x, pts[(i + 1) % (pts.length)].y);

        let opG = orthogonalProjection(a, b, pG);
        let opH = orthogonalProjection(a, b, pH);

        if(dist(opG.x, opG.y, pG.x, pG.y) < minG) {
          minG = dist(opG.x, opG.y, pG.x, pG.y);
        }
        if(dist(opH.x, opH.y, pH.x, pH.y) < minH) {
          minH = dist(opH.x, opH.y, pH.x, pH.y);
        }
      } else {

        //create the seg line
        let ptax = pts[i].x;
        let ptay = pts[i].y;
        let ptbx = pts[(i + 1) % (pts.length)].x;
        let ptby = pts[(i + 1) % (pts.length)].y;

        //if(i == 1)
        //  text(interPtG[0] + ", " + interPtG[1], 100, 100);
        //check G
        let buffer = dist(ex, ey, fx, fy) / 64;
        if (collidePointLine(gx, gy, ptax, ptay, ptbx, ptby, buffer)) {
          gHit = true;
        }
        if (collidePointLine(hx, hy, ptax, ptay, ptbx, ptby, buffer)) {
          hHit = true;
        }
      }

		}
    let buffer = dist(ex, ey, fx, fy) / 64;
    if(minG < buffer) {
      gHit = true;
    }
    if(minH < buffer) {
      hHit = true;
    }

		if (gHit && hHit && dist(ex, ey, fx, fy) > 10) {//10
			squares[squares.length] = new square(createVector(ex, ey), createVector(gx, gy), createVector(fx, fy), createVector(hx, hy));
      if(changeSquarePoint) {
			  pts[e].x += random(-5, 5);
			  pts[e].y += random(-5, 5);
      }
		}

		//UPDATE E AND F
		//e and f start at 0
		if (e < pts.length - 1) {
			if (f < pts.length - 1) {
				f++;
			} else {
				//if f is obove max then reset f and change e
        if(handShake) {
				  f = e + 1;//0
        } else {
          f = 0;
        }
				e++;
			}
		} else {
			if (repeat) {
				e = 0;
			}
			else {
				//noLoop();
        start = false;
        drawn = false;
			}
		}
    //EARLY reset
    if(mouseHeld) { 
      start = false;
      drawn = false;
    }

	}
}

//Do things with the math done in squareTest()
function squareResult(){

}


function reset() {
	//SUB-POINTS
	pts = [];
	for (i = 0; i < sgs.length; i++) {
		let ax = sgs[i].x;
		let ay = sgs[i].y;
		let bx = sgs[(i + 1) % (sgs.length)].x;
		let by = sgs[(i + 1) % (sgs.length)].y;
		let m = (by - ay) / (bx - ax);
		let a = getTheta(ax, ay, bx, by);

		let cx = ax;
		let cy = ay;
		while (((ax <= cx && cx <= bx) || (bx <= cx && cx <= ax)) && ((ay <= cy && cy <= by) || (by <= cy && cy <= ay))) {
			pts[pts.length] = createVector(cx, cy);
			cx += l * cos(a);
			cy += l * sin(a);
		}
	}
	//SUCCESSFUL SQUARES
	squares = [];
	//TEST INDEX
	e = 0;
	f = 0;
}

function noScroll() {
  window.scrollTo(0, 0);
}

// add listener to disable scroll
window.addEventListener('scroll', noScroll);

// Remove listener to re-enable scroll
window.removeEventListener('scroll', noScroll);

function setL() {
  //l = int(sgs.length/8);
  
  minX = sgs[0].x;
  minY = sgs[0].y;
  maxX = sgs[0].x;
  maxY = sgs[0].y;
  for(i = 0; i<sgs.length; i++) {
    if(sgs[i].x > maxX) {
      maxX = sgs[i].x;
    }
    if(sgs[i].x < minX) {
      minX = sgs[i].x;
    }
    if(sgs[i].y > maxY) {
      maxY = sgs[i].y;
    }
    if(sgs[i].y < minY) {
      minY = sgs[i].y;
    }
  }
  l = dist(minX, minY, maxX, maxY)/50;//50
  
}
//p5 vector math
function orthogonalProjection(a, b, p) {
  
  // find nearest point alont a SEGMENT 
  
  d1 = p5.Vector.sub(b, a);
  d2 = p5.Vector.sub(p, a);
  l1 = d1.mag();
  
  dotp = constrain(d2.dot(d1.normalize()), 0, l1);
      
  return p5.Vector.add(a, d1.mult(dotp))
  
}