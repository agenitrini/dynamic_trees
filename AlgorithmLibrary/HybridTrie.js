// Copyright 2016 David Galles, University of San Francisco. All rights reserved.
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
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIIBTED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
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
// or implied, of the University of San Francisco


// Constants.


TrieHybride.NODE_WIDTH = 30;

TrieHybride.CENTER_LINK_COLOR = "#007700";
TrieHybride.SIDE_LINK_COLOR = "#8888AA";
TrieHybride.HIGHLIGHT_CIRCLE_COLOR = "#007700";
TrieHybride.FOREGROUND_COLOR = "#007700";
TrieHybride.BACKGROUND_COLOR = "#CCFFCC";
TrieHybride.TRUE_COLOR = "#CCFFCC";
TrieHybride.PRINT_COLOR = TrieHybride.FOREGROUND_COLOR;
TrieHybride.FALSE_COLOR = "#FFFFFF"
TrieHybride.WIDTH_DELTA = 50;
TrieHybride.HEIGHT_DELTA = 50;
TrieHybride.STARTING_Y = 20;
TrieHybride.LeftMargin = 300;
TrieHybride.NEW_NODE_Y = 100
TrieHybride.NEW_NODE_X = 50;
TrieHybride.FIRST_PRINT_POS_X = 50;
TrieHybride.PRINT_VERTICAL_GAP = 20;
TrieHybride.PRINT_HORIZONTAL_GAP = 50;



function TrieHybride(am, w, h) {
    this.init(am, w, h);
}

TrieHybride.prototype = new Algorithm();
TrieHybride.prototype.constructor = TrieHybride;
TrieHybride.superclass = Algorithm.prototype;

TrieHybride.prototype.init = function (am, w, h) {
    var sc = TrieHybride.superclass;
    this.startingX = w / 2;
    this.first_print_pos_y = h - 2 * TrieHybride.PRINT_VERTICAL_GAP;
    this.print_max = w - 10;

    var fn = sc.init;
    fn.call(this, am);
    this.addControls();
    this.value = 0;
    this.nextIndex = 0;
    this.commands = [];
    this.cmd("CreateLabel", 0, "", 20, 10, 0);
    this.cmd("CreateLabel", 1, "", 20, 10, 0);
    this.cmd("CreateLabel", 2, "", 20, 30, 0);
    this.nextIndex = 3;
    this.root = null;
    this.animationManager.StartNewAnimation(this.commands);
    this.animationManager.skipForward();
    this.animationManager.clearHistory();
}


TrieHybride.prototype.addControls = function () {
    this.insertField = addControlToAlgorithmBar("Text", "");
    this.insertField.onkeypress = this.returnSubmit(this.insertField, this.insertCallback.bind(this), 12, false);
    this.insertButton = addControlToAlgorithmBar("Button", "Insert");
    this.insertButton.onclick = this.insertCallback.bind(this);
    this.deleteField = addControlToAlgorithmBar("Text", "");
    this.deleteField.onkeydown = this.returnSubmit(this.deleteField, this.deleteCallback.bind(this), 12);
    this.deleteButton = addControlToAlgorithmBar("Button", "Delete");
    this.deleteButton.onclick = this.deleteCallback.bind(this);
    this.findField = addControlToAlgorithmBar("Text", "");
    this.findField.onkeydown = this.returnSubmit(this.findField, this.findCallback.bind(this), 12);
    this.findButton = addControlToAlgorithmBar("Button", "Find");
    this.findButton.onclick = this.findCallback.bind(this);
    this.printButton = addControlToAlgorithmBar("Button", "Print");
    this.printButton.onclick = this.printCallback.bind(this);
}

TrieHybride.prototype.reset = function () {
    this.nextIndex = 3;
    this.root = null;
}

TrieHybride.prototype.insertCallback = function (event) {
    var insertedValue = this.insertField.value.toUpperCase()
    insertedValue = insertedValue.replace(/[^a-z]/gi, '');

    if (insertedValue != "") {
        // set text value
        this.insertField.value = "";
        this.implementAction(this.add.bind(this), insertedValue);
    }
}


TrieHybride.prototype.deleteCallback = function (event) {
    var deletedValue = this.deleteField.value.toUpperCase();
    deletedValue = deletedValue.replace(/[^a-z]/gi, '');
    if (deletedValue != "") {
        this.deleteField.value = "";
        this.implementAction(this.deleteElement.bind(this), deletedValue);
    }

}

/**
 * 
 * @param {The tree corresponding to the word to be deleted} tree 
 * @returns The tree after removing “tree"
 */
TrieHybride.prototype.cleanupAfterDelete = function (tree) {
    if (tree == null) { // hybride trie is empty
        return;
    }
    /** it is a prefix of another word, we only remove its value */
    else if (tree.center.nextChar != ' ' ) {  
        tree.order = "";
        tree.content = tree.nextChar;
        this.cmd("SetText", tree.graphicID, tree.content);

        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("SetText", 2, "Clerning up after delete ...\nTree has center child, no more cleanup required");
        this.cmd("step");
        this.cmd("SetText", 2, "");
        this.cmd("SetHighlight", tree.graphicID, 0);
        return;
    }
    /** It is a leaf */
    else if (tree.center.nextChar == ' '  && tree.left.nextChar == ' '  && tree.right.nextChar == ' ') { 
        /** it represents the end of the word (attribute isword is true), we stop and do not delete nothing.  */
        if(tree.isword == true) { 
            this.cmd("SetHighlight", tree.graphicID, 1);
            this.cmd("SetText", 2, "Clerning up after delete ...\nLeaf at end of word, no more cleanup required");
            this.cmd("step");
            this.cmd("SetText", 2, "");
            this.cmd("SetHighlight", tree.graphicID, 0);
            return;
        }
        
        /** It does not represent the end of the word. */
        this.cmd("SetText", 2, "Clearning up after delete ...");
        this.cmd("SetHighlight", tree.graphicID, 1);
        this.cmd("step");
        this.cmd("Delete", tree.graphicID);
        
        /** It is the root, remove its three sons. */
        if (tree.parent == null) { 
            this.cmd("Delete", tree.left.graphicID);
            this.cmd("Delete", tree.center.graphicID);
            this.cmd("Delete", tree.right.graphicID);
            this.root = null;
        }
        /** It is the left son of its parent  */
        else if (tree.parent.left == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID); // remove the link between it and its parent 
            tree.parent.left = tree.center;
            tree.center.parent = tree.parent;
            this.cmd("Delete", tree.left.graphicID);
            this.cmd("Delete", tree.right.graphicID);

            // establish a link between its parent and its middle son (empty node) 
            this.cmd("Connect", tree.parent.graphicID, tree.center.graphicID, TrieHybride.SIDE_LINK_COLOR, 0.0001, false, "<" + tree.parent.nextChar);
            this.resizeTree();
        }
         /** It is the right son of its parent  */
        else if (tree.parent.right == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            tree.parent.right = tree.center;
            tree.center.parent = tree.parent;
            this.cmd("Delete", tree.left.graphicID);
            this.cmd("Delete", tree.right.graphicID);

            this.cmd("Connect", tree.parent.graphicID, tree.center.graphicID, TrieHybride.SIDE_LINK_COLOR, -0.0001, false, ">" + tree.parent.nextChar);
            this.resizeTree();
        }
         /** It is the middle son of its parent  */
        else if (tree.parent.center == tree) {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            tree.parent.center = tree.center;
            tree.center.parent = tree.parent;
            this.cmd("Delete", tree.left.graphicID);
            this.cmd("Delete", tree.right.graphicID);
            
            this.cmd("Connect", tree.parent.graphicID, tree.center.graphicID, TrieHybride.CENTER_LINK_COLOR, 0.0001, false, "=" + tree.parent.nextChar);
            this.resizeTree();
        }
        
        this.cleanupAfterDelete(tree.parent);
    }
    /** Have a son on the left or right.  */
    else if ((tree.left.nextChar == ' ' && tree.center.nextChar == ' ') || (tree.right.nextChar == ' ' && tree.center.nextChar == ' ')) { 
        var child = null;
        if (tree.left.nextChar != ' ')
            child = tree.left;
        else
            child = tree.right;
        this.cmd("Disconnect", tree.graphicID, child.graphicID);
        /** It is the root, replace the root with its son. */
        if (tree.parent == null) {
            this.cmd("Delete", tree.graphicID);
            this.root = child;
        }
        else {
            this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
            child.parent = tree.parent;
            this.cmd("Step");
            this.cmd("Delete", tree.graphicID);
            this.cmd("Delete", child == tree.left ? tree.right.graphicID : tree.left.graphicID);
            if (tree.parent.left == tree) {
                tree.parent.left = child;
                this.cmd("Delete", tree.center.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, TrieHybride.SIDE_LINK_COLOR, 0.0001, false, "<" + tree.parent.nextChar)
            }
            else if (tree.parent.right == tree) {
                tree.parent.right = child;
                this.cmd("Delete", tree.center.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, TrieHybride.SIDE_LINK_COLOR, -0.0001, false, ">" + tree.parent.nextChar)
            }
            else if (tree.parent.center == tree) {
                tree.parent.center = child;
                this.cmd("Delete", tree.center.graphicID);
                this.cmd("Connect", tree.parent.graphicID, child.graphicID, TrieHybride.CENTER_LINK_COLOR, -0.0001, false, "=" + tree.parent.nextChar)
            }
            else {
                throw ("What??")
            }
            this.resizeTree();
        }
    }
    /** Have two sons on the left and right. */
    else if (tree.right.nextChar != ' ' && tree.center.nextChar == ' ' && tree.right.nextChar != ' ') { 
        var node = tree.left;
        this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
        this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
        this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
        this.cmd("Step");
        
        /**
         * We start with his left son and work our way down until we find the right subtree farthest from his left son.
         * And we make this node found the parent of the right son. 
         * We replace the current node with its new left child.
         */
        while (node.right != null) {
            node = node.right;
            this.cmd("Move", this.highlightID, node.x, node.y);
            this.cmd("Step");
        }
        this.cmd("Disconnect", tree.graphicID, tree.right.graphicID);
        this.cmd("Disconnect", tree.graphicID, tree.left.graphicID);
        this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
        this.cmd("Connect", tree.parent.graphicID, tree.left.graphicID, TrieHybride.CENTER_LINK_COLOR, 0.0001, false, "=" + tree.parent.nextChar)
        tree.left.parent = tree.parent;
        tree.parent.center = tree.left;

        this.cmd("Disconnect", node.parent.graphicID, node.graphicID);
        node.parent.right = tree.right;
        tree.right.parent = node.parent;
        this.cmd("Connect", node.parent.graphicID, tree.right.graphicID, TrieHybride.SIDE_LINK_COLOR, -0.0001, false, ">" + node.parent.nextChar)
        this.cmd("Delete", node.graphicID);

        this.cmd("Delete", this.highlightID);
        this.cmd("Delete", tree.graphicID);
        this.cmd("Delete", tree.center.graphicID);
        this.cmd("Step");
    }
}

/**
 * 
 * @param {The word to delete} word 
 * @returns The tree after removing the word
 */
TrieHybride.prototype.deleteElement = function (word) {
    this.commands = [];
    this.cmd("SetText", 0, "Deleting: ");
    this.cmd("SetText", 1, "\"" + word + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");

    /**
     * We find the word in the tree, if we find it then we delete it, otherwise we do nothing.
     */
    var node = this.doFind(this.root, word);
    if (node != null) {
        this.cmd("SetHighlight", node.graphicID, 1);
        this.cmd("SetText", 2, "Found \"" + word + "\", setting value in tree to False");
        this.cmd("step");
        this.cmd("SetBackgroundColor", node.graphicID, TrieHybride.FALSE_COLOR);
        node.isword = false;
        this.cmd("SetHighlight", node.graphicID, 0);
        this.cleanupAfterDelete(node);
        this.resizeTree();
    }
    else {
        this.cmd("SetText", 2, "\"" + word + "\" not in tree, nothing to delete");
        this.cmd("step");
        this.cmd("SetHighlightIndex", 1, -1);
    }

    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");
    return this.commands;
}


TrieHybride.prototype.printCallback = function (event) {
    this.implementAction(this.printTree.bind(this), "");
}


TrieHybride.prototype.printTree = function (unused) {

    this.commands = [];

    if (this.root != null) {
        this.highlightID = this.nextIndex++;
        this.printLabel1 = this.nextIndex++;
        this.printLabel2 = this.nextIndex++;
        var firstLabel = this.nextIndex++;
        this.cmd("CreateLabel", firstLabel, "Output: ", TrieHybride.FIRST_PRINT_POS_X, this.first_print_pos_y);
        this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
        this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
        this.cmd("CreateLabel", this.printLabel1, "Current String: ", 20, 10, 0);
        this.cmd("CreateLabel", this.printLabel2, "", 20, 10, 0);
        this.cmd("AlignRight", this.printLabel2, this.printLabel1);
        this.xPosOfNextLabel = TrieHybride.FIRST_PRINT_POS_X;
        this.yPosOfNextLabel = this.first_print_pos_y;
        this.printTreeRec(this.root, "");

        this.cmd("Delete", this.highlightID);
        this.cmd("Delete", this.printLabel1);
        this.cmd("Delete", this.printLabel2);
        this.cmd("Step")

        for (var i = firstLabel; i < this.nextIndex; i++) {
            this.cmd("Delete", i);
        }
        this.nextIndex = this.highlightID;  /// Reuse objects.  Not necessary.
    }
    return this.commands;

}

TrieHybride.prototype.printTreeRec = function (tree, stringSoFar) {
    if (tree.isword) {
        var nextLabelID = this.nextIndex++;
        this.cmd("CreateLabel", nextLabelID, stringSoFar + "  ", 20, 10, 0);
        this.cmd("SetForegroundColor", nextLabelID, TrieHybride.PRINT_COLOR);
        this.cmd("AlignRight", nextLabelID, this.printLabel1, TrieHybride.PRINT_COLOR);
        this.cmd("MoveToAlignRight", nextLabelID, nextLabelID - 1);
        this.cmd("Step");

        this.xPosOfNextLabel += TrieHybride.PRINT_HORIZONTAL_GAP;
        if (this.xPosOfNextLabel > this.print_max) {
            this.xPosOfNextLabel = TrieHybride.FIRST_PRINT_POS_X;
            this.yPosOfNextLabel += Ternrary.PRINT_VERTICAL_GAP;
        }


    }
    if (tree.left != null) {
        this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
        this.cmd("Step");
        this.printTreeRec(tree.left, stringSoFar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");


    }
    if (tree.center != null) {
        var nextLabelID = this.nextIndex;
        this.cmd("CreateLabel", nextLabelID, tree.nextChar, tree.x, tree.y, 0);
        this.cmd("MoveToAlignRight", nextLabelID, this.printLabel2);

        this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
        this.cmd("Step");
        this.cmd("Delete", nextLabelID);
        this.cmd("SetText", this.printLabel2, stringSoFar + tree.nextChar);
        this.printTreeRec(tree.center, stringSoFar + tree.nextChar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("SetText", this.printLabel2, stringSoFar);
        this.cmd("Step");


    }
    if (tree.right != null) {
        this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
        this.cmd("Step");
        this.printTreeRec(tree.right, stringSoFar);
        this.cmd("Move", this.highlightID, tree.x, tree.y);
        this.cmd("Step");
    }
}

TrieHybride.prototype.findCallback = function (event) {
    var findValue = this.findField.value.toUpperCase()
    finndValue = findValue.replace(/[^a-z]/gi, '');
    this.findField.value = "";
    this.implementAction(this.findElement.bind(this), findValue);
}

TrieHybride.prototype.findElement = function (word) {
    this.commands = [];
    this.commands = new Array();
    this.cmd("SetText", 0, "Finding: ");
    this.cmd("SetText", 1, "\"" + word + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");

    var node = this.doFind(this.root, word);
    if (node != null) {
        this.cmd("SetText", 0, "Found \"" + word + "\"");
    }
    else {
        this.cmd("SetText", 0, "\"" + word + "\" not Found");
    }

    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");

    return this.commands;
}

/**
 * 
 * @param {trie hybrid} tree 
 * @param {the word to find} s 
 * @returns the node being the end of the word if s in tree, otherwise null
 */
TrieHybride.prototype.doFind = function (tree, s) {

    if (tree == null) {
        this.cmd("SetText", 2, "Reached null tree\nWord is not in the tree");
        this.cmd("Step");
        return null;
    }
    this.cmd("SetHighlight", tree.graphicID, 1);
    this.cmd("SetHighlightIndex", 1, 1);

    var child = null;
    if (tree.nextChar == s.charAt(0)) {
        child = tree.center;
        if (s.length == 1) // if it is the end of the word 
        {
            this.cmd("SetText", 2, "Reached the end of the string \nCurrent node is True\nWord is in the tree");
            this.cmd("Step");
            this.cmd("SetHighlight", tree.graphicID , 0);
            if (tree.isword) // the word is found
            {
                return tree;
            }
            else // the word not found
            {
                return null;
            }
        }
        s = s.substring(1);
    }
    else if (tree.nextChar > s.charAt(0)) {
        this.cmd("SetText", 2, "Next character in string < Character at current node\nRecursively look at left node, \nleaving search string as it is");
        this.cmd("Step");
        child = tree.left;
    }
    else {
        this.cmd("SetText", 2, "Next character in string > Character at current node\nRecursively look at left right, \nleaving search string as it is");
        this.cmd("Step");
        child = tree.right;
    }
    if(child.nextChar == ' ') {
        this.cmd("SetHighlight", tree.graphicID , 0);
        return null;
    }
    this.cmd("SetText", 1, "\"" + s + "\"");
    this.cmd("SetHighlightIndex", 1, -1);

    this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
    this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
    this.cmd("SetHighlight", tree.graphicID, 0);

    this.cmd("Move", this.highlightID, child.x, child.y);
    this.cmd("Step")
    this.cmd("Delete", this.highlightID);
    console.log("child: ", child);
    console.log("s: ", s);
    return this.doFind(child, s);
    
}

TrieHybride.prototype.insertElement = function (insertedValue) {
    this.cmd("SetText", 0, "");
    return this.commands;
}


TrieHybride.prototype.insert = function (elem, tree) {

}



TrieHybride.prototype.resizeTree = function () {
    this.resizeWidths(this.root);
    if (this.root != null) {
        var startingPoint = TrieHybride.LeftMargin;
        if (this.root.left == null) {
            startingPoint += TrieHybride.NODE_WIDTH / 2;
        }
        else {
            startingPoint += this.root.left.width;
        }

        //        var startingPoint = this.root.width / 2 + 1 + TrieHybride.LeftMargin;
        this.setNewPositions(this.root, startingPoint, TrieHybride.STARTING_Y);
        this.animateNewPositions(this.root);
        this.cmd("Step");
    }

}


TrieHybride.prototype.add = function (word) {
    this.commands = new Array();
    this.cmd("SetText", 0, "Inserting; ");
    this.cmd("SetText", 1, "\"" + word + "\"");
    this.cmd("AlignRight", 1, 0);
    this.cmd("Step");
    if (this.root == null) {
        this.cmd("CreateCircle", this.nextIndex, " ", TrieHybride.NEW_NODE_X, TrieHybride.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, TrieHybride.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, TrieHybride.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, TrieHybride.NODE_WIDTH);
        this.cmd("SetText", 2, "Creating a new root");
        // create the root of the hybrid trie
        this.root = new TrieHybrideNode(" ", this.nextIndex, TrieHybride.NEW_NODE_X, TrieHybride.NEW_NODE_Y);
        this.cmd("Step");
        this.resizeTree();
        this.cmd("SetText", 2, "");
        this.nextIndex += 1;
        this.highlightID = this.nextIndex++;
    }
    this.addR(word.toUpperCase(), this.root);

    this.cmd("SetText", 0, "");
    this.cmd("SetText", 1, "");
    this.cmd("SetText", 2, "");

    return this.commands;
}

/**
 * 
 * @param {The tree to which the node will be added} tree 
 * @param {New node to be generated} child 
 * @param {The first character of the word} label 
 * @returns a new hybrid trie node
 */
TrieHybride.prototype.createIfNotExtant = function (tree, child, label) {
    if (child == null) {
        this.cmd("CreateCircle", this.nextIndex, " ", TrieHybride.NEW_NODE_X, TrieHybride.NEW_NODE_Y);
        this.cmd("SetForegroundColor", this.nextIndex, TrieHybride.FOREGROUND_COLOR);
        this.cmd("SetBackgroundColor", this.nextIndex, TrieHybride.FALSE_COLOR);
        this.cmd("SetWidth", this.nextIndex, TrieHybride.NODE_WIDTH);
        this.cmd("SetText", 2, "Creating a new node");
        child = new TrieHybrideNode(" ", this.nextIndex, TrieHybride.NEW_NODE_X, TrieHybride.NEW_NODE_Y)
        this.cmd("Step");
        var dir = 0.0001;
        if (label.charAt(0) == '>') {
            dir = -0.0001
        }
        var color = TrieHybride.FOREGROUND_COLOR;
        if (label.charAt(0) == "=") {
            color = TrieHybride.CENTER_LINK_COLOR;
        }
        else {
            color = TrieHybride.SIDE_LINK_COLOR;
        }
        this.cmd("Connect", tree.graphicID, this.nextIndex, color, dir, false, label)
        this.cmd("SetText", 2, "");
        this.nextIndex++;
        this.highlightID = this.nextIndex++;
    }
    return child;
}

/**
 * 
 * @param {The word to add in the tree} s 
 * @param {The tree to which the word will be added} tree 
 * @returns tree after adding s
 */
TrieHybride.prototype.addR = function (s, tree) {
    this.cmd("SetHighlight", tree.graphicID, 1);

    if (s.length == 0) { // if the word is empty
        this.cmd("SetText", 2, "Reached the end of the string \nSet current node to true");
        this.cmd("Step");
        this.cmd("SetHighlight", tree.graphicID, 0);
        return;
    }
    else {
        this.cmd("SetHighlightIndex", 1, 1);
        if (tree.nextChar == ' ') { // if the node is empty
            if(s.length == 1) { // if the last character of the word
                this.cmd("SetBackgroundColor", tree.graphicID, TrieHybride.TRUE_COLOR);
                tree.isword = true;
                this.value += 1;
                tree.order = this.value;
            }
            tree.nextChar = s.charAt(0);
            tree.content = tree.order == "" ? tree.nextChar : (tree.nextChar + ", " + tree.order) ; // update the label of the node

            this.cmd("SetText", 2, "No character for this node, setting to " + s.charAt(0));
            this.cmd("SetText", tree.graphicID, tree.content); 
            this.cmd("Step");

            /**
             * creation of the three empty child nodes
             */
            tree.center = this.createIfNotExtant(tree, tree.center, "=" + s.charAt(0));
            tree.center.parent = tree;
            this.resizeTree();
            tree.left = this.createIfNotExtant(tree, tree.left, "<" + s.charAt(0));
            tree.left.parent = tree;
            this.resizeTree();
            tree.right = this.createIfNotExtant(tree, tree.right, ">" + s.charAt(0));
            tree.right.parent = tree;
            this.resizeTree();
           
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
            this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
            this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
            this.cmd("Step")
            this.cmd("Delete", this.highlightID);

            this.addR(s.substring(1), tree.center)
        }
        else if (tree.nextChar == s.charAt(0)) { // The character to be inserted is equal to the character stored in the current node
            this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
            this.cmd("SetText", 2, "Making recursive call to center child, passing in \"" + s.substring(1) + "\"");
            this.cmd("Step")
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("SetText", 1, "\"" + s.substring(1) + "\"");
            
            s = s.substring(1);
            if (s.length == 0) { 
                // If the word is a prefix of an existing word in the hybrid sortIf the word is a prefix of an existing word in the hybrid trie
                if(tree.order == "") {
                    this.cmd("SetBackgroundColor", tree.graphicID, TrieHybride.TRUE_COLOR);
                    tree.isword = true;
                    this.value += 1;
                    tree.order = this.value;
                    tree.content = tree.nextChar + ", " + tree.order ;
                    this.cmd("SetText", tree.graphicID, tree.content); 
                }
                this.cmd("Delete", this.highlightID);
            }
            else {
                this.cmd("Move", this.highlightID, tree.center.x, tree.center.y);
                this.cmd("Step")
                this.cmd("Delete", this.highlightID);
                this.addR(s, tree.center);
            }
        }
        else {
            var child = null;
            var label = "";
            if (tree.nextChar > s.charAt(0)) {  //the character to be inserted is smaller than the character stored in the current node
                label = "<" + tree.nextChar;
                this.cmd("SetText", 2, "Next character in stirng is < value stored at current node \n Making recursive call to left child passing in \"" + s + "\"");
                tree.left = this.createIfNotExtant(tree, tree.left, label);
                tree.left.parent = tree;
                child = tree.left;
                this.resizeTree();
            }
            else { // the character to be inserted is greater than the character stored in the current node
                label = ">" + tree.nextChar;
                this.cmd("SetText", 2, "Next character in stirng is > value stored at current node \n Making recursive call to right child passing in \"" + s + "\"");
                tree.right = this.createIfNotExtant(tree, tree.right, label);
                tree.right.parent = tree;
                child = tree.right;
                this.resizeTree();
            }
            
            this.cmd("CreateHighlightCircle", this.highlightID, TrieHybride.HIGHLIGHT_CIRCLE_COLOR, tree.x, tree.y);
            this.cmd("SetWidth", this.highlightID, TrieHybride.NODE_WIDTH);
            this.cmd("Step")
            this.cmd("SetHighlight", tree.graphicID, 0);
            this.cmd("SetHighlightIndex", 1, -1);
            this.cmd("Move", this.highlightID, child.x, child.y);
            this.cmd("Step")
            this.cmd("Delete", this.highlightID);
            this.addR(s, child)
        }
    }
}

TrieHybride.prototype.setNewPositions = function (tree, xLeft, yPosition) {
    if (tree != null) {
        tree.x = xLeft + TrieHybride.NODE_WIDTH / 2;
        tree.y = yPosition;
        var newYPos = yPosition + TrieHybride.HEIGHT_DELTA;
        if (tree.left != null) {
            this.setNewPositions(tree.left, xLeft, newYPos);
        }
        if (tree.center != null) {
            this.setNewPositions(tree.center, xLeft + tree.leftWidth, newYPos);
            tree.x = tree.center.x;
        }
        if (tree.right != null) {
            this.setNewPositions(tree.right, xLeft + tree.leftWidth + tree.centerWidth, newYPos);
        }
    }
}

TrieHybride.prototype.animateNewPositions = function (tree) {
    if (tree != null) {
        this.cmd("Move", tree.graphicID, tree.x, tree.y);
        this.animateNewPositions(tree.left)
        this.animateNewPositions(tree.center)
        this.animateNewPositions(tree.right)
    }
}

TrieHybride.prototype.resizeWidths = function (tree) {
    if (tree == null) {
        return 0;
    }
    tree.leftWidth = (this.resizeWidths(tree.left));
    tree.centerWidth = (this.resizeWidths(tree.center));
    tree.rightWidth = (this.resizeWidths(tree.right));
    tree.width = Math.max(tree.leftWidth + tree.centerWidth + tree.rightWidth, TrieHybride.NODE_WIDTH + 4);
    return tree.width;
}

/**
 * structure du trie hybride
 * @param {caractère du nœud} val 
 * @param {identifiant du nœud} id 
 * @param {l'abscisse du noeud} initialX 
 * @param {l'ordonnée du noeud} initialY 
 */
function TrieHybrideNode(val, id, initialX, initialY) {
    this.nextChar = val;
    this.graphicID = id;
    this.x = initialX;
    this.y = initialY;

    this.left = null;
    this.center = null;
    this.right = null;
    this.leftWidth = 0;
    this.centerWidth = 0;
    this.rightWwidth = 0;
    this.parent = null;
    this.order = "";
    this.content = "";
}

TrieHybride.prototype.disableUI = function (event) {
    this.insertField.disabled = true;
    this.insertButton.disabled = true;
    this.deleteField.disabled = true;
    this.deleteButton.disabled = true;
    this.findField.disabled = true;
    this.findButton.disabled = true;
    this.printButton.disabled = true;
}

TrieHybride.prototype.enableUI = function (event) {
    this.insertField.disabled = false;
    this.insertButton.disabled = false;
    this.deleteField.disabled = false;
    this.deleteButton.disabled = false;
    this.findField.disabled = false;
    this.findButton.disabled = false;
    this.printButton.disabled = false;
}


var currentAlg;

function init() {
    var animManag = initCanvas();
    currentAlg = new TrieHybride(animManag, canvas.width, canvas.height);
}
