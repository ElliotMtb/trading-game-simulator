/*
    A linked list implementation
*/

var app = app || {};

app.LinkedList = (function() {

    function LinkedList(items) {

        this.firstNode = null;

        // Reverse the items, because they will be inserted in reverse
        items.reverse();

        var i;

        for (i = 0; i < items.length; i++) {

            var newNode = {
                data: items[i]
            };

            this.InsertBeginning(newNode);
        }
    }

    function LinkedList_InsertBeginning(newNode) {

        newNode.next = this.firstNode;
        this.firstNode = newNode;
    }

    function LinkedList_InsertAfter(node, newNode) {

        newNode.next = node.next;
        node.next = newNode;
    }

    function LinkedList_RemoveBeginning() {

        this.firstNode = this.firstNode.next;
    }

    function LinkedList_RemoveAfter(node) {

        node.next = node.next.next;
    }

    function LinkedList_First() {

        return this.firstNode;
    }

    function LinkedList_ToString() {
        
        var returnString = "";

        if (this.First() !== null) {
            
            var firstNode = this.First();

            returnString += firstNode.data;

            firstNode = firstNode.next;

            while (firstNode !== null) {

                returnString += ", " + firstNode.data;

                firstNode = firstNode.next;
            }
        }

        return returnString;
    }

    LinkedList.prototype.InsertBeginning = LinkedList_InsertBeginning;
    LinkedList.prototype.InsertAfter = LinkedList_InsertAfter;
    LinkedList.prototype.RemoveBeginning = LinkedList_RemoveBeginning;
    LinkedList.prototype.RemoveAfter = LinkedList_RemoveAfter;
    LinkedList.prototype.ToString = LinkedList_ToString;
    LinkedList.prototype.First = LinkedList_First;

    return {
        LinkedList: LinkedList
    };

})();