/*
    A circular linked list implementation for tracking player turn order
*/

var app = app || {};

app.CircularLinkedList = (function() {

    function CircularLinkedList(items) {
        
        this.lastNode = null;

        for (i = 0; i < items.length; i++) {

            var newNode = {
                data: items[i],
                next: null,
                prev: null
            };

            this.AddToEnd(newNode);
        }
    }

    function CircularLinkedList_First() {
        
        return this.lastNode.next;
    }

    function CircularLinkedList_Last() {
        
        return this.lastNode;
    }

    function CircularLinkedList_InsertAfter(node, toInsert) {

        if (node === null) {

            toInsert.prev = toInsert;
            toInsert.next =  toInsert;
            this.lastNode = toInsert;
        }
        else {

            node.next.prev = toInsert;
            toInsert.prev = node;

            toInsert.next = node.next;
            node.next = toInsert;

            if (node === this.lastNode) {

                this.lastNode = toInsert;
            }
        }
    }

    function CircularLinkedList_RemoveFirst() {

        this.lastNode.next.next.prev = this.lastNode;
        this.lastNode.next = this.lastNode.next.next;
    }

    function CircularLinkedList_AddToEnd(node) {

        this.InsertAfter(this.lastNode, node);
    }

    function CircularLinkedList_ToString() {

        var returnString = "";

        if (this.First() !== null) {
            
            var firstNode = this.First();

            returnString += firstNode.data;

            firstNode = firstNode.next;

            while (firstNode !== this.First()) {

                returnString += ", " + firstNode.data;

                firstNode = firstNode.next;
            }
        }

        return returnString;
    }

    CircularLinkedList.prototype.First = CircularLinkedList_First;
    CircularLinkedList.prototype.Last = CircularLinkedList_Last;
    CircularLinkedList.prototype.InsertAfter = CircularLinkedList_InsertAfter;
    
    CircularLinkedList.prototype.RemoveFirst = CircularLinkedList_RemoveFirst;
    CircularLinkedList.prototype.AddToEnd = CircularLinkedList_AddToEnd;

    CircularLinkedList.prototype.ToString = CircularLinkedList_ToString;

    return {
        CircularLinkedList : CircularLinkedList
    };
})();