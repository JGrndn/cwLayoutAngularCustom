/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
    "use strict";
  
  var cwLayoutAngularCustom;

  cwLayoutAngularCustom = function (options, viewSchema) {
    cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
    this.drawOneMethod = this.drawOne.bind(this);
    cwApi.registerLayoutForJSActions(this);
    this.layoutsByNodeId = {};
  };

  cwLayoutAngularCustom.prototype.getTemplatePath = function(folder, templateName) {
    return cwApi.format('{0}/html/{1}/{2}.ng.html', cwApi.getCommonContentPath(), folder, templateName);
  };

  cwLayoutAngularCustom.prototype.applyJavaScript = function () {
    var that = this, templateName = this.options.CustomOptions['template-name'];
    cwApi.CwAsyncLoader.load('angular', function () {
      var loader = cwApi.CwAngularLoader, templatePath, $container = $('#' + that.domId);
      loader.setup();
      templatePath = that.getTemplatePath('cwLayoutAngularCustom', templateName);
      loader.loadControllerWithTemplate('cwLayoutAngularCustom', $container, templatePath, function ($scope) {
        $scope.getNodeName = function(nodeId){
          return that.viewSchema.NodesByID[nodeId].NodeName;
        };

        $scope.getMaxRowspan = function(lst){
          if (cwApi.isUndefined(lst)){
            return 1;
          }
          return Math.max(lst.length, 1);
        };

        $scope.getItemDisplayString = function(item){
          var layoutOptions, getDisplayStringFromLayout = function(layout){
            return layout.getDisplayItem(item);
          };
          if (item.nodeID === that.nodeID){
            return that.getDisplayItem(item);
          }
          if (!that.layoutsByNodeId.hasOwnProperty(item.nodeID)){
            if (that.viewSchema.NodesByID.hasOwnProperty(item.nodeID)){
              layoutOptions = that.viewSchema.NodesByID[item.nodeID].LayoutOptions;
              that.layoutsByNodeId[item.nodeID] = new cwApi.cwLayouts[item.layoutName](layoutOptions, that.viewSchema);
            } else {
              return item.name;
            }
          }
          return getDisplayStringFromLayout(that.layoutsByNodeId[item.nodeID]);
        };

        $scope.data = that.data;
        $scope.metadata = that.metadata;
        $scope.htmlData = that.htmlData;
      });
    });
  };

  cwLayoutAngularCustom.prototype.drawOne = function (output, item, callback) {
    /*jslint unparam:true*/
    return undefined;
  };

  cwLayoutAngularCustom.prototype.drawAssociations = function (output, associationTitleText, object) {
    /*jslint unparam:true*/
    var objectId, associationTargetNode, i, j, child;
    if (cwApi.isUndefinedOrNull(object) || cwApi.isUndefined(object.associations)) {
      // Is a creation page therefore a real object does not exist
      if (!cwApi.isUndefined(this.mmNode.AssociationsTargetObjectTypes[this.nodeID])) {
        objectId = 0;
        associationTargetNode = this.mmNode.AssociationsTargetObjectTypes[this.nodeID];
      } else {
        return;
      }
    } else {
      if (!cwApi.isUndefined(object.associations[this.nodeID])) {
        objectId = object.object_id;
        associationTargetNode = object.associations[this.nodeID];
      } else {
        if (object.iAssociations !== undefined && object.iAssociations[this.nodeID] !== undefined) {
          objectId = object.object_id;
          associationTargetNode = object.iAssociations[this.nodeID];
        } else {
          return;
        }
      }
    }
    this.domId = 'cw-layout-' + this.nodeID;
    output.push('<div id="', this.domId,'" class="', this.nodeID, " ", this.nodeID, "-", objectId, ' ', this.LayoutName, ' ', this.mmNode.LayoutDrawOne, " ot-", this.mmNode.ObjectTypeScriptName.toLowerCase(), '">');
    output.push('</div');

    this.metadata = this.getNextNodeIds();
    this.data = [];
    this.htmlData = {};
    for (i = 0; i < associationTargetNode.length; i += 1) {
      child = associationTargetNode[i];
      this.data.push(child);
      this.htmlData[child.object_id] = {};
      for(j=0; j < this.metadata.length; j+=1){
        this.htmlData[child.object_id][this.metadata[j]] = this.getLayoutContent(child, this.metadata[j]);
      }
    }
    this.metadata.unshift(this.nodeID);
  };

  cwLayoutAngularCustom.prototype.getNextNodeIds = function() {
    var i, lst = [];
    for(i=0; i<this.mmNode.SortedChildren.length; i+=1){
      if (this.mmNode.SortedChildren[i].Type === 1){
        lst.push(this.mmNode.SortedChildren[i].NodeId);
      }
    }
    return lst;
  };

  cwLayoutAngularCustom.prototype.getLayoutContent = function(object, nodeId){
    var output = [], node = this.viewSchema.NodesByID[nodeId], layout;
    layout = new cwApi.cwLayouts[node.LayoutName](node.LayoutOptions, this.viewSchema);
    layout.drawAssociations(output, '', object);
    return output.join('');
  };

  cwApi.cwLayouts.cwLayoutAngularCustom = cwLayoutAngularCustom;



}(cwAPI, jQuery));