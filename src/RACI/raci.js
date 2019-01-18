/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";

  var engine = function (associationTargetNode, options, layout) {
    cwApi.extend(this, cwApi.customLibs.cwLayoutAngularCustom.displayEngine, associationTargetNode, options, layout);
    this.output = {
      metadata : layout.getNextNodeIds(),
      headers: (this.options.IntermediateId) ? [this.layout.nodeID, this.options.IntermediateId] : [this.layout.nodeID],
      data : [],
      linkedObjects : [],
      columns : []
    };
  };

  engine.prototype.executeTemplate = function ($scope) {
    var that = this;
    $scope.data = this.output.data;
    $scope.customColumns = this.output.linkedObjects;
    $scope.stdColumns = this.output.columns;
    $scope.HasIntermediateLevel = (this.options.IntermediateId) ? true : false;
    $scope.headers = this.output.headers;
    
    $scope.clipboard = {
      value: this.getClipboardValue(this.output.data),
      copy: function(){
        var elem = document.getElementById('clipboard-input-'+$scope.layoutId);
        elem.select();
        document.execCommand('copy');
        cwApi.notificationManager.addNotification($.i18n.prop('raci_matrix_dataCopiedToClipBoard'));
      }
    };
  };
  
  engine.prototype.getClipboardValue = function(input){
    var output = [], data = this.arrangeData(input);
    data.forEach(function (row) {
      var dataString = row.map(function(cell){
        var nCell = cell ? cell.replace(/"/g, '""') : ""; // double quotes to display them correctly
        return "\"" + nCell + "\"";
      }).join("\t");
      output.push(dataString);
    });
    return output.join('\n');
  };
  
  engine.prototype.arrangeData = function(input){
    var that = this, header = [], content = []; //[["na\"me10\rname11", 2, 3], ["name2", 4, 5], ["name3", 6, 7], ["name4", 8, 9], ["name5", 10, 11]];
    // header
    header.push(this.output.headers.map(function(nodeId){
      return that.getNodeName(nodeId);
    }).concat(this.output.linkedObjects.map(function(item){
      return that.getItemDisplayString(item, true);
    })).concat(this.output.columns.map(function (nodeId){
      return that.getNodeName(nodeId);
    })));
    // content
    var parents = [];
    content = this.output.data.map(function(item){
      var r1 = [];
      if (that.options.IntermediateId) {
        var p = that.getItemDisplayString(item.parent, true);
        if (parents.indexOf(p) === -1){
          r1.push(p);
          parents.push(p);
        } else {
          r1.push(''); // empty as parent is present on previous row
        }
      }
      r1.push(that.getItemDisplayString(item, true));
      var r2 = that.output.linkedObjects.map(function(child){
        return item.customColumns[child.customId].join('');
      });
      var r3 = that.output.columns.map(function(assoId){
        return item.associations[assoId].map(function(target){
          return that.getItemDisplayString(target, true);
        }).join('\n');
      });
      return r1.concat(r2).concat(r3);
    });   
    return header.concat(content);
  };

  engine.prototype.drawAssociations = function () {
    if (this.options.IntermediateId){
      this.drawForIntermediate(this.data);
    } else {
      this.drawForDirect(this.data);
    }
    this.output.linkedObjects.sort(function (a, b) {
      return (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 1;
    });
    this.output.metadata.unshift(this.layout.nodeID);
  };

  function getItemInArray(arr, item){
    var i=0, foundItem = null;
    for(i=0; i<arr.length; i+=1){
      if (item.object_id === arr[i].object_id && item.objectTypeScriptName === arr[i].objectTypeScriptName){
        foundItem = arr[i];
        break;
      }
    }
    return foundItem;
  }

  engine.prototype.drawForIntermediate = function(items){
    var i=0, j=0, data = [], obj, child, nodeId;
    nodeId = this.options.IntermediateId;
    for(i=0; i<items.length; i+=1){
      obj = items[i];
      obj.rowSpan = obj.associations[nodeId].length;
      for(j=0; j<obj.associations[nodeId].length; j+=1){
        child = obj.associations[nodeId][j];
        child.parent = obj;
        data.push(child);
      }
    }
    this.drawForDirect(data);
  };

  engine.prototype.drawForDirect = function(items){
    var i=0, j=0, k=0, obj, linkedObjects = [], columns = [], data = [];
    for(i=0; i<items.length; i+=1){
      obj = items[i];
      for(j=0; j<this.options.CustomColumns.length; j+=1){
        if(obj.associations.hasOwnProperty(this.options.CustomColumns[j].NodeId)){
          for(k=0; k<obj.associations[this.options.CustomColumns[j].NodeId].length; k+=1){
            var child = getItemInArray(linkedObjects, obj.associations[this.options.CustomColumns[j].NodeId][k]);
            if (child === null){
              child = obj.associations[this.options.CustomColumns[j].NodeId][k];
              child.customId = child.objectTypeScriptName + '|' + child.object_id;
              linkedObjects.push(child);
            }
          }
        }
      }
    }
    
    for(i=0; i<this.options.Columns.length; i+=1){
      columns.push(this.options.Columns[i].NodeId);
    }
    this.output.linkedObjects = linkedObjects;
    this.output.columns = columns;

    for(i=0; i<items.length; i+=1){
      obj = items[i];
      obj.customColumns = {};
      for(j=0; j<this.output.linkedObjects.length; j+=1){
        var tgt = this.output.linkedObjects[j];
        var result = [];
        for(k=0; k<this.options.CustomColumns.length; k+=1){
          var col = this.options.CustomColumns[k];
          if (getItemInArray(obj.associations[col.NodeId], this.output.linkedObjects[j]) !== null){
            result.push(col.Content);
          }
        }
        obj.customColumns[tgt.customId] = result;
      }
      data.push(obj);
    }
    this.output.data = data;
  };

  if (!cwApi.customLibs) {
    cwApi.customLibs = {};
  }
  if (!cwApi.customLibs.cwLayoutAngularCustom) {
    cwApi.customLibs.cwLayoutAngularCustom = {};
  }
  if (!cwApi.customLibs.cwLayoutAngularCustom.raci) {
    cwApi.customLibs.cwLayoutAngularCustom.raci = engine;
  }


}(cwAPI, jQuery));