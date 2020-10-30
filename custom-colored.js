function checkForSymbol(symbol) {
	for(var i = 0; i<equations.length; i++){
		if ( equations[i].equation_variable == symbol ) {
			return equations[i];
		}	
	}
	return false;
} 
findNovelChildren = function(node){
	return node.isSymbolNode && checkForSymbol(node.name) && !activeSymbols.includes(node.name);
}

activeSymbols = [];
function makeNodes(symbol) {
	equationObject = checkForSymbol(symbol);
	if(equationObject) {
		activeSymbols.push(symbol);

		var mathJSequation = math.parse(equationObject.equation);

		var variable = equationObject.equation_variable;
		var equationText = "$$" + mathJSequation.toTex({parenthesis: parenthesis, implicit: implicit}) + "$$";
		var descriptionText = equationObject.description;

		var outputNode = {
			HTMLid: variable,
			collapsable: true,
			text: {
				equation_name: variable,
				equation: equationText,
				description: descriptionText
			},
			children: []
		}

		var addThese = mathJSequation.filter(findNovelChildren);
		console.log(addThese);
		for(var i = 0; i<addThese.length; i++){
			if(!activeSymbols.includes(addThese[i].name)){
				outputNode.children.push(makeNodes(addThese[i].name));
			}
		}
		return outputNode;
	}	
		else { alert("invalid root node"); return false; }
}

function genconfig(rootsymbol){
    var chart_config = {
        chart: {
            container: "#equationtree",

            nodeAlign: "BOTTOM",

	    callback: {
		onTreeLoaded: addClickable
	    },

            connectors: {
                type: 'step'
            },
            node: {
                HTMLclass: 'nodeExample1'
            }
        },
        nodeStructure: makeNodes(rootsymbol)
    };
    return chart_config;
}
	function refresh() {	
		activeSymbols = [];
		var config = genconfig("ms");
		console.log(config);
		new Treant( config );
		MathJax.Hub.Queue(['Typeset', MathJax.Hub, "equationtree"]) 
	}
	refresh();
