/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";

  var engine = function (associationTargetNode, options, layout) {
    cwApi.extend(this, cwApi.customLibs.cwLayoutAngularCustom.displayEngine, associationTargetNode, options, layout);
    this.output = {
      metadata: layout.getNextNodeIds(),
      data: [],
      htmlData: {}
    };
  };

  engine.prototype.executeTemplate = function ($scope) {
    $scope.data = this.output.data;
    $scope.customColumns = this.output.linkedObjects;
    $scope.stdColumns = this.output.columns;
    $scope.HasIntermediateLevel = (this.options.IntermediateId) ? true : false;
    $scope.headers = (this.options.IntermediateId) ? [this.layout.nodeID, this.options.IntermediateId] : [this.layout.nodeID];
  };

  engine.prototype.drawAssociations = function () {
    if (this.options.IntermediateId) {
      this.drawForIntermediate(this.data);
    } else {
      this.drawForDirect(this.data);
    }
    this.output.metadata.unshift(this.layout.nodeID);
  };

  function getItemInArray(arr, item) {
    var i = 0, foundItem = null;
    for (i = 0; i < arr.length; i += 1) {
      if (item.object_id === arr[i].object_id && item.objectTypeScriptName === arr[i].objectTypeScriptName) {
        foundItem = arr[i];
        break;
      }
    }
    return foundItem;
  }

  engine.prototype.drawForIntermediate = function (items) {
    var i = 0, j = 0, data = [], obj, child, nodeId;
    nodeId = this.options.IntermediateId;
    for (i = 0; i < items.length; i += 1) {
      obj = items[i];
      obj.rowSpan = obj.associations[nodeId].length;
      for (j = 0; j < obj.associations[nodeId].length; j += 1) {
        child = obj.associations[nodeId][j];
        child.parent = obj;
        data.push(child);
      }
    }
    this.drawForDirect(data);
  };

  engine.prototype.drawForDirect = function (items) {
    var i = 0, j = 0, k = 0, obj, linkedObjects = [], columns = [], data = [];
    for (i = 0; i < items.length; i += 1) {
      obj = items[i];
      for (j = 0; j < this.options.CustomColumns.length; j += 1) {
        if (obj.associations.hasOwnProperty(this.options.CustomColumns[j].NodeId)) {
          for (k = 0; k < obj.associations[this.options.CustomColumns[j].NodeId].length; k += 1) {
            var child = getItemInArray(linkedObjects, obj.associations[this.options.CustomColumns[j].NodeId][k]);
            if (child === null) {
              child = obj.associations[this.options.CustomColumns[j].NodeId][k];
              child.customId = child.objectTypeScriptName + '|' + child.object_id;
              linkedObjects.push(child);
            }
          }
        }
      }
    }

    for (i = 0; i < this.options.Columns.length; i += 1) {
      columns.push(this.options.Columns[i].NodeId);
    }
    this.output.linkedObjects = linkedObjects;
    this.output.columns = columns;

    for (i = 0; i < items.length; i += 1) {
      obj = items[i];
      obj.customColumns = {};
      for (j = 0; j < this.output.linkedObjects.length; j += 1) {
        var tgt = this.output.linkedObjects[j];
        var result = [];
        for (k = 0; k < this.options.CustomColumns.length; k += 1) {
          var col = this.options.CustomColumns[k];
          if (getItemInArray(obj.associations[col.NodeId], this.output.linkedObjects[j]) !== null) {
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