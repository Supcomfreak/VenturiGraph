// STORAGE

// Stores equations as a list of objects
var equations = [];


var jsonio = document.getElementById("json");

function outputEquations() {
	jsonio.value = JSON.stringify(equations);
}

function inputEquations() {
	console.log(jsonio.value);
	equations = JSON.parse(jsonio.value);
}

jsonio.oninput = function() {
	inputEquations();
	event.preventDefault()
	refresh()
}
// INPUT

// Update render of equation being added
const addEquationInput = document.getElementById('eq');
const addEquationRender = document.getElementById('add-equation_render');
let parenthesis = 'keep';
let implicit = 'hide';

  // initialize with an example expression
  addEquationInput.value = 'sin(x)';
  addEquationRender.innerHTML = '$$' + math.parse(addEquationInput.value).toTex({parenthesis: parenthesis}) + '$$';

addEquationInput.oninput = function () {
	let node = null;
	try {      
		node = math.parse(addEquationInput.value)
		const latex = node ? node.toTex({parenthesis: parenthesis, implicit: implicit}) : '';
    console.log('LaTeX expression:', latex)

		const elem = MathJax.Hub.getAllJax('add-equation_render')[0]
	  MathJax.Hub.Queue(['Text', elem, latex])
	}	catch (err) {
		console.log(err.toString())
	}
}

// when a node is clicked, fill it's values into the input fields below
function addClickable(){
	for (var i = 0; i<equations.length; i++){
		var currentEq = equations[i].equation_variable;
		console.log(currentEq);
		function closuresDumb(whatnumber){
			var closenumber = whatnumber;
			return function() {
				document.getElementById("eq").value = equations[closenumber].equation; 
				document.getElementById("eqvar").value = equations[closenumber].equation_variable;
				document.getElementById("descriptioninput").value = equations[closenumber].description;
			}
		}
		var closedFunction = closuresDumb(i);
		try {
		console.log(document.getElementById(currentEq).innerHTML);
		document.getElementById(currentEq).onclick = closedFunction;
		} catch (err) {
		console.log(err.toString());
		}
	}
}
// checks if variableName is in the equation dictionary, and if it is returns the equation object with that variable name
function findVariableName(variableName) {
	for(var i = 0; i < equations.length; i++){
		if (equations[i].equation_variable == variableName){
			return i;
		}
	}
		return false;
}

// adds or updates equation in form to the equation dictionary
function addEquation() {
		var variableName = document.getElementById('eqvar').value
		var mathJSequation = math.parse(addEquationInput.value)
		var descriptiontext = document.getElementById("descriptioninput").value;
		output = {
			equation_variable: variableName,
			equation: mathJSequation.toString(),
			description: descriptiontext
		}
		
		var checkEquations = findVariableName(variableName);
		if(Number.isInteger(checkEquations)){
			equations[checkEquations] = output;
		} else {
			equations.push(output);
		}
}


// Add equation to main list and update visualization when button is pressed
document.getElementById('add-equation_form').onsubmit = function (event) {
	event.preventDefault()
	addEquation()
	outputEquations()
	refresh()
}

// GRAPH EQUATION PREP

// state

var inputVariableForm = document.getElementById('input-var')
var inputVariable = inputVariableForm.value;

var toGraph;

// Recursively replaces all symbol nodes with names in the equation table with their respective equations
var combineEquations = function (node, path, parent) {
	if(node.isSymbolNode && node.name != inputVariable && node.name in equations) {
		return equations[node.name].transform(combineEquations)
	} else {
		return node
	}
}

// Callback function to loose variables
var looseVariables = function (node, path, parent) {
	if(path != "fn" && node.name != inputVariable && node.isSymbolNode) {
		if(!(node.name in graphVariables)){
			graphVariables[node.name] = null
		}
	}
}

// create a single number input for a variable
function renderGraphOption(varName) {
	$('#loose-variables').prepend($("<div class='graph-variable'><label for='" + "var_" + varName + "'>" + varName + "</label><input type='text' id='" + "var_" + varName + "' + value='" + graphVariables[varName] + "' /></div>"))
	console.log(varName)
}

// Create scope window from graphVariables object

//Display selected equation
document.getElementById('select-equation_form').onsubmit = function (event) {
	event.preventDefault()	

	inputVariable = document.getElementById('input-var').value

	// get equation to render
	var selected = document.getElementById('output-var').value
	try {
		var node = equations[selected].transform(combineEquations)
		
		document.getElementById('selected-equation_render').innerHTML= "$$" + node.toTex({parenthesis: parenthesis}) + "$$"
		document.getElementById('selected-equation_plaintext').innerHTML= node.toString();
		//MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'selected-equation_render'])

		toGraph = node

		node.traverse(looseVariables)
		
		renderScopeWindow()
	} catch (err) {
		alert(err.toString())
	}
}

//GRAPH DRAW
document.getElementById('draw').onsubmit = function () {
	event.preventDefault()	

	r1 = math.parse(document.getElementById('range-low').value).transform(combineEquations).evaluate()
	r2 = math.parse(document.getElementById('range-high').value).transform(combineEquations).evaluate()
	spacing = Math.abs(r2-r1)/100

	updateScope()

	const xValues = math.range(r1, r2, spacing).toArray()
	const yValues = xValues.map(function (xval) {
		graphVariables[inputVariable] = xval
		console.log(xval)
		return toGraph.evaluate(graphVariables)
  })
	console.log(yValues)
      const trace1 = {
        x: xValues,
        y: yValues,
        type: 'scatter'
      }
      const data = [trace1]
      Plotly.newPlot('graph', data)
}

// Calculatethings

function getEquationByVar(vari) {
	for(var i = 0; i<equations.length; i++){
		if(equations[i].equation_variable == vari) {
			return equations[i].equation;
		}
	}
	return false;
}


function makeCombinedEquation(eqVar) {
	var combineEquations_new = function (node, path, parent) {
		if(node.isSymbolNode && node.name != eqVar && getEquationByVar(node.name)) {
			return math.parse(getEquationByVar(node.name)).transform(combineEquations_new)
		} else {
			return node
		}
	}
	
	equation = getEquationByVar(eqVar);
	if(equation){
		var mathJSequationa = math.parse(equation);
		output = mathJSequationa.transform(combineEquations_new);
		console.log(output.toString());
		return output;
	}
}

//Actually Calculate Something
function addInput(inputName) {
	$node = '<div class="graphvariables_input"><p>' + inputName + '</p><input type="number" step="0.01" name="' + inputName + '" id="'+ "input_" + inputName + '"></input></div>'
	$('#graphvariables').prepend($node)
}

function setupCalculator() {
	
	$('#graphvariables').empty();
	var graphVariables = {}
	var looseVariables_new = function (node, path, parent) {
		if(path != "fn" && node.name != inputVariable && node.name != "pi" && node.isSymbolNode) {
			if(!(node.name in graphVariables)){
				graphVariables[node.name] = null
			}
		}
	}
	makeCombinedEquation("ms").traverse(looseVariables_new)
	for (graphVariable in graphVariables) {
		addInput(graphVariable);
	}
	$node = '<input type="submit" id="submit" value="Calculate"></input>'
	$('#graphvariables').append($node)
	$("#graphstuff").show();


	function calculateOutput() {
		for (graphVariable in graphVariables){
			graphVariables[graphVariable] = Number(document.getElementById("input_"+graphVariable).value);
		}
		output = makeCombinedEquation("ms").evaluate(graphVariables)
		console.log(output);
		document.getElementById("output").innerHTML = output;
	}
	document.getElementById("graphvariables").onsubmit = function() { 
		event.preventDefault()
		calculateOutput() 
	}
}
function hideGraph(){	
	$("#graphstuff").hide();
}


document.getElementById("graphbuttonz").onclick = function() { setupCalculator() };


//Change root node equation identifier
