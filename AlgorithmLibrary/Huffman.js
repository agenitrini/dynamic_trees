// Copyright 2015 Yves Lucet, University of British Columbia Okanagan. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of British Columbia Okanagan.

function Huffman(am, w, h) {
    this.init(am, w, h);
}

function init() {
    var animManag = initCanvas();
    currentAlg = new Huffman(animManag, canvas.width, canvas.height);
}

Huffman.prototype = new Algorithm();
Huffman.prototype.constructor = Huffman;
Huffman.superclass = Algorithm.prototype;

Huffman.MARGIN_X = 40;
Huffman.MARGIN_Y = 60;
Huffman.STATUS_LABEL_X = 20;
Huffman.STATUS_LABEL_Y = 20;
Huffman.TEXT_CODE_LABEL_X = 20;
Huffman.TEXT_CODE_LABEL_Y = 40;
Huffman.NODE_WIDTH = 50;
Huffman.NODE_HEIGHT = 25;
Huffman.NODE_SPACING_X = 30;
Huffman.NODE_SPACING_Y = 35;
Huffman.STARTING_X = 50;
Huffman.STARTING_Y = 100;

Huffman.NORMAL_FG_COLOR = "#000";
Huffman.ROOT_FG_COLOR = "#00f";

Huffman.key = 1
Huffman.word = ""
Huffman.structTree = null
Huffman.textCode = "Text code : "

Huffman.prototype.init = function (am, w, h) {
    Huffman.superclass.init.call(this, am, w, h);
    this.addControls();
    this.reset();
}

Huffman.prototype.addControls = function () {
    this.controls = [];

    this.btnReset = addControlToAlgorithmBar("Button", "Reset");
    this.btnReset.onclick = this.reset.bind(this);
    this.controls.push(this.btnReset);

    this.btnBuild = addControlToAlgorithmBar("Button", "Build tree");
    this.btnBuild.onclick = this.buildTreeCallback.bind(this);
    this.controls.push(this.btnBuild);

    this.lblText = addLabelToAlgorithmBar("Text:");
    this.txtText = addControlToAlgorithmBar("Text", "");
    this.controls.push(this.txtText);
}

Huffman.prototype.disableUI = function (event) {
    this.setEnabled(false);
}

Huffman.prototype.enableUI = function (event) {
    this.setEnabled(true);
}

Huffman.prototype.setEnabled = function (b) {
    for (var i = 0; i < this.controls.length; ++i) {
        this.controls[i].disabled = !b;
    }
}

Huffman.prototype.reset = function () {
    this.animationManager.resetAll()
    this.clearHistory()

    this.commands = []
    Huffman.word = ""
    Huffman.textCode = "Text code : "
}

Huffman.prototype.buildTreeCallback = function () {
    if (this.txtText.value === "")return
    
    if (Huffman.word == "") {
        Huffman.word = this.txtText.value
        let leafSpecial2 = Huffman.prototype.newSpecialLeaf(Huffman.key++, null)
        this.cmd("CreateCircle", leafSpecial2.key, "#", 100, 100)
        leafSpecial2.x = 100
        leafSpecial2.y = 100
        Huffman.structTree = Huffman.prototype.newStructTree(leafSpecial2, leafSpecial2)

        this.statusId = Huffman.key++
        this.cmd("CreateLabel", this.statusId, "", Huffman.STATUS_LABEL_X, Huffman.STATUS_LABEL_Y, 0)

        this.textCodeLabelId = Huffman.key++
        this.cmd("CreateLabel", this.textCodeLabelId, "text code", Huffman.TEXT_CODE_LABEL_X, Huffman.TEXT_CODE_LABEL_Y, 0)
    }else{
        this.commands = []
        Huffman.word = this.txtText.value
    }

    this.processCreateTree(Huffman.structTree, Huffman.word)
    this.animationManager.StartNewAnimation(this.commands)

}

Huffman.prototype.processCreateTree = function (structTree, word) {
    for (let char of word) {
        let codeChar = this.getCodeChar(structTree.root, char)
        if(codeChar === "")
            Huffman.textCode +=  " " + this.getCodeChar(structTree.root, "#")  + " " + char.charCodeAt(0).toString(2)
        else {
            Huffman.textCode += codeChar + " "
        }
        this.setTextCode(Huffman.textCode)
        this.processAddValue(structTree, char)
    }
}

//les enfants sont inversés
Huffman.prototype.getCodeChar = function (tree, char, res="") {
    if(tree.children.length === 0){
        if(tree.value === char)
            return res
        else 
            return ""
    }else{
        return this.getCodeChar(tree.children[0],char,res+"1") + this.getCodeChar(tree.children[1],char,res+"0")
    }
}

//on considère ici que le tree est binaire
Huffman.prototype.drawTree = function (tree, x = Huffman.MARGIN_X, y = Huffman.MARGIN_Y) {
    let nbLeaf = this.getNbLeaf(tree)
    let width = nbLeaf * (Huffman.NODE_WIDTH + Huffman.NODE_SPACING_X)
    let label
    if (tree.value != undefined) label = tree.value
    else label = tree.weight
    this.cmd("CreateCircle", tree.key, label, 0, 0)
    this.cmd("Step")
    this.cmd("Move", tree.key, x + (width / 2), y)

    //l'affichage est inversé par rapport à la structure de l'arbre
    if (tree.children[0] != null) {
        this.drawTree(tree.children[0], x + (width / 2), y + Huffman.NODE_SPACING_Y + Huffman.NODE_HEIGHT)
        this.cmd("Connect", tree.key, tree.children[0].key);
    }
    if (tree.children[1] != null) {
        this.drawTree(tree.children[1], x, y + Huffman.NODE_SPACING_Y + Huffman.NODE_HEIGHT)
        this.cmd("Connect", tree.key, tree.children[1].key);
    }
}

Huffman.prototype.getDepth = function (tree) {
    if (tree.children.length == 0) return 1
    let depth = 0
    for (let child of tree.children) {
        let d = this.getDepth(child)
        depth = Math.max(depth, d)
    }
    return depth + 1
}

Huffman.prototype.getNbLeaf = function (tree) {
    if (tree.children.length == 0) return 1
    let cpt = 0
    for (let child of tree.children) {
        cpt += this.getNbLeaf(child)
    }
    return cpt
}

Huffman.prototype.newStructTree = function (root, specialLeaf) {
    return {
        root: root,
        specialLeaf: specialLeaf
    }
}

Huffman.prototype.newTree = function (key, parent, weight) {
    return {
        key: key,
        weight: weight,
        parent: parent,
        children: [],
        next: null,
        prev: null,

        // Visualization properties.
        width: Huffman.NODE_WIDTH,
        childWidths : []
    }
}

Huffman.prototype.newNode = function (key, parent, weight) {
    return this.newTree(key, parent, weight)
}

Huffman.prototype.newLeaf = function (key, parent, weight, value) {
    let base = this.newTree(key, parent, weight)
    base.value = value
    return base
}

Huffman.prototype.newSpecialLeaf = function (key, parent) {
    let base = this.newLeaf(key, parent, 0, '#')
    base.special = true
    return base
}

let removeChildren = (arrayChildren, children) => {
    let index = arrayChildren.findIndex(elt => elt.key == children.key)
    if (index >= 0) arrayChildren.splice(index, 1)
}

Huffman.prototype.processAddValue = function (structTree, value) {
    this.setStatus(`Ajout du caractere "${value}"`)
    this.cmd("Step")
    this.addValue(structTree, value)
    let check = this.checkListBlock(structTree.specialLeaf)

    while (!check.res) {
        this.setStatus("L'abre ne respecte pas le parcours GDBH. On procede donc a un reamenagement")
        this.cmd("Step")
        let a1 = this.findFirstOccWeight(structTree.specialLeaf, check.first.weight)
        let a2 = this.findLastOccWeight(structTree.specialLeaf, check.second.weight)

        this.cmd("SetHighlight", a1.key, 1)
        this.cmd("SetHighlight", a2.key, 1)
        this.cmd("Step")
        this.cmd("SetHighlight", a1.key, 0)
        this.cmd("SetHighlight", a2.key, 0)
        this.cmd("Step")

        this.swap2Tree(a1, a2, structTree)
        this.updateWeightFromLeaf(a1)
        this.updateWeightFromLeaf(a2)
        check = this.checkListBlock(a2)
    }
}

Huffman.prototype.checkListBlock = function (elt, eltPrev = null) {
    if (eltPrev != null) {
        if (elt.weight < eltPrev.weight) return { res: false, first: eltPrev, second: elt }
    }
    if (elt.next != null) return this.checkListBlock(elt.next, elt)
    return { res: true }
}

Huffman.prototype.addValue = function (structTree, value) {
    let leaf = this.findValue(structTree.root, value)
    if (leaf != null) {
        leaf.weight++
        this.updateWeightFromLeaf(leaf)
        //visualisation
        this.cmd("SetBackgroundColor", leaf.key, "#ffff00")
        this.cmd("SetText", leaf.key, leaf.value + "," + leaf.weight)
        this.cmd("Step")
        this.cmd("SetBackgroundColor", leaf.key, "#ffffff")
        this.cmd("Step")
    } else {
        //recuperation de la feuille special
        let specialLeaf = structTree.specialLeaf
        //creation du nouveau noeud
        let newNode = this.newNode(Huffman.key++, specialLeaf.parent, 1)
        //retrait de la feuille special de son parent et ajout dans ce dernier du nouveau noeud
        if (specialLeaf.parent != null) {
            removeChildren(specialLeaf.parent.children, specialLeaf)
            specialLeaf.parent.children.push(newNode)
        }
        //on definit le nouveau parent de la feuille speciale
        specialLeaf.parent = newNode
        //on creer une nouvelle feuille
        let newLeaf = this.newLeaf(Huffman.key++, newNode, 1, value)
        //on definit les enfants du nouveau noeud
        newNode.children.push(newLeaf)
        newNode.children.push(specialLeaf)

        // si notre arbre est compose uniquement de la feuille speciale
        if (structTree.root == structTree.specialLeaf) {
            structTree.root = newNode
        }

        // mise à jour de la liste chaîne
        newNode.next = specialLeaf.next
        newLeaf.next = newNode
        if (specialLeaf.next != null) specialLeaf.next.prev = newNode
        specialLeaf.next = newLeaf

        newNode.prev = newLeaf
        newLeaf.prev = specialLeaf



        //visualisation
        if (newNode.parent) this.cmd("Disconnect", newNode.parent.key, specialLeaf.key)
        this.cmd("CreateCircle", newLeaf.key, newLeaf.value + "," + newLeaf.weight, 300, 50)
        this.cmd("CreateCircle", newNode.key, newNode.weight, specialLeaf.x, specialLeaf.y)
        if (newNode.parent) this.cmd("Connect", newNode.parent.key, newNode.key)
        this.resizeWidths(structTree.root)
        this.repositionTree(structTree.root)
        this.cmd("Step")
        this.cmd("Connect", newNode.key, newNode.children[0].key);
        this.cmd("Connect", newNode.key, newNode.children[1].key);
        this.cmd("Step")


        //suite algo
        this.updateWeightFromLeaf(newLeaf)
    }
}

//l'affichage des enfants est inversé, children[0] est à droite et children[1] est à gauche
Huffman.prototype.repositionTree = function (tree, x = Huffman.STARTING_X, y = Huffman.STARTING_Y) {
    if (tree.children[1] != null){
        this.cmd("Move", tree.key, x + tree.childWidths[1] - (Huffman.NODE_WIDTH/2), y)
    }
    else{
        this.cmd("Move", tree.key, x + tree.width/2 - (Huffman.NODE_WIDTH/2), y)
    }
    if (tree.children[1] != null) {
        this.repositionTree(tree.children[1], x , y + Huffman.NODE_SPACING_Y + Huffman.NODE_HEIGHT)
    }
    if (tree.children[1] != null) {
        this.repositionTree(tree.children[0], x + tree.childWidths[1], y + Huffman.NODE_SPACING_Y + Huffman.NODE_HEIGHT)
    }
}

Huffman.prototype.resizeWidths = function(tree) 
{
	if (tree == null){
		return 0;
	}
    var size = 0;
	for (var i = 0; i < tree.children.length; i++){
            tree.childWidths[i] = this.resizeWidths(tree.children[i]);
            size += tree.childWidths[i]
	}
    tree.width = Math.max(size, Huffman.NODE_WIDTH)
    return tree.width;
}

Huffman.prototype.findFirstOccWeight = function (tree, weight) {
    if (tree == undefined) return null
    if (tree.weight == weight) return tree
    return this.findFirstOccWeight(tree.next, weight)
}

Huffman.prototype.findLastOccWeight = function (tree, weight, endBlock) {
    if (tree.next == null) return endBlock
    if (tree.weight == weight) endBlock = tree
    return this.findLastOccWeight(tree.next, weight, endBlock)
}

Huffman.prototype.printList = function (list, res = "") {
    if (res == "") res = "["
    res += "(" + list.key + "," + list.weight + ")"
    if (list.next != null) return this.printList(list.next, res)
    else return res + "]"
}

Huffman.prototype.treeToString = function (tree) {
    let res = "(" + tree.key + "," + tree.weight
    if (tree.children.length != 0) res += ", child : ["
    for (let child of tree.children) {
        res += this.treeToString(child)
    }
    if (tree.children.length != 0) res += "]"
    res += ")"
    return res
}

Huffman.prototype.swap2Tree = function (a1, a2, structTree) {
    //on créer une copie des parents de a1 et a2
    let parent_a1 = a1.parent
    let parent_a2 = a2.parent

    //on inverse les enfants des parents de a1 et a2
    //le parent de a1 récupère a2 comme enfant et le parents de a2 récupère a1 comme enfant

    let indice_a1 = parent_a1.children.findIndex(elt => elt.key == a1.key)
    let indice_a2 = parent_a2.children.findIndex(elt => elt.key == a2.key)

    parent_a1.children[indice_a1] = a2
    parent_a2.children[indice_a2] = a1

    //on inverse les parents de a1 et de a2
    //a1 à comme parents l'ancien parent de a2 et inversement
    a1.parent = parent_a2
    a2.parent = parent_a1

    //mise à jour de la liste de bloc
    let next_a1 = a1.next
    let prev_a1 = a1.prev

    let next_a2 = a2.next
    let prev_a2 = a2.prev

    //on peut factorise certain cas
    if (a1.next == a2) {
        //cas ou liste = [ x , x , a1 , a2 , x , x ]
        a1.prev = a2
        a1.next = next_a2
        prev_a1.next = a2

        a2.next = a1
        a2.prev = prev_a1
        next_a2.prev = a1
    } else {
        //cas ou liste = [ x , a1 , x , x , a2 , x ]
        //à tester
        a1.prev.next = a2
        a1.next.prev = a2
        a2.prev.next = a1
        a2.next.prev = a1

        a1.prev = prev_a2
        a1.next = next_a2
        a2.prev = prev_a1
        a2.next = next_a1
    }

    //visualisation
    this.cmd("Disconnect", parent_a1.key, a1.key)
    this.cmd("Disconnect", parent_a2.key, a2.key)
    this.resizeWidths(structTree.root)
    console.log(structTree.root)
    this.repositionTree(structTree.root)
    this.cmd("Step")
    this.cmd("Connect", parent_a2.key, a1.key)
    this.cmd("Connect", parent_a1.key, a2.key)
    this.cmd("Step")

}

Huffman.prototype.updateWeightAllTree = function (tree) {
    if (tree.value != undefined) return tree.weight
    else {
        let w = 0
        for (let child of tree.children) {
            w += this.updateWeightAllTree(child)
        }
        tree.weight = w
        this.cmd("SetText", tree.key, tree.weight)
        return w
    }
}

Huffman.prototype.updateWeightFromLeaf = function (tree) {
    if (tree.value == undefined) {
        let w = 0
        for (let child of tree.children) {
            w += child.weight
        }
        tree.weight = w
        this.cmd("SetText", tree.key, tree.weight)
    }
    if (tree.parent == null) return
    else this.updateWeightFromLeaf(tree.parent)
}

Huffman.prototype.findValue = function (arbre, value) {
    if (arbre.value) {
        if (arbre.value == value && arbre.special == undefined) {
            return arbre
        }
    }
    else {
        for (let child of arbre.children) {
            let res = this.findValue(child, value)
            if (res != null) return res
        }
        return null
    }
}

Huffman.prototype.findSpecial = function (arbre) {

    if (arbre.special) {
        return arbre
    }

    else {
        for (let child of arbre.children) {
            let res = this.findSpecial(child)
            if (res != null) return res
        }
        return null
    }
}

// Sets the text displayed in the status label.
Huffman.prototype.setStatus = function (msg) {
    this.cmd("SetText", this.statusId, msg);
}

Huffman.prototype.setTextCode = function (msg) {
    this.cmd("SetText", this.textCodeLabelId, msg);
}


